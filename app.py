import os
import yaml
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, abort
from flask import send_from_directory
from werkzeug.utils import secure_filename
from flask_socketio import SocketIO
from flask_socketio import emit
from PIL import Image, ExifTags
import uuid  

# Configuración de Flask
app = Flask(__name__)
app.secret_key = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855d'
socketio = SocketIO(app)

# Directorios
PROFILE_PICTURE_FOLDER = 'static/profile_pictures'
USER_PHOTOS_FOLDER = 'static/user_photos'
DATA_FILE = 'data.yaml'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

os.makedirs(PROFILE_PICTURE_FOLDER, exist_ok=True)
os.makedirs(USER_PHOTOS_FOLDER, exist_ok=True)

# Funciones auxiliares
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_to_webp(input_path, output_path):
    with Image.open(input_path) as img:
        img = img.convert('RGB')  # Aseguramos compatibilidad con WebP
        img.save(output_path, 'webp', quality=85)

class UserManager:
    @staticmethod
    def load_data():
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                return yaml.safe_load(f) or {}
        return {}

    @staticmethod
    def save_data(data):
        with open(DATA_FILE, 'w') as f:
            yaml.dump(data, f)

# Rutas principales
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        profile_pic = request.files.get('profile_pic')

        if not name or not profile_pic or not allowed_file(profile_pic.filename):
            return "Invalid input. Ensure all fields are filled correctly.", 400

        profile_pic_filename = secure_filename(profile_pic.filename)
        profile_pic_path = os.path.join(PROFILE_PICTURE_FOLDER, f'{name}_{profile_pic_filename}')
        profile_pic.save(profile_pic_path)

        # Corregir la orientación de la imagen
        fix_orientation(profile_pic_path)

        # Convertir la imagen a WebP
        webp_path = profile_pic_path.rsplit('.', 1)[0] + '.webp'
        convert_to_webp(profile_pic_path, webp_path)

        # Usar el nuevo archivo WebP y normalizar rutas
        os.remove(profile_pic_path)
        normalized_profile_pic_path = webp_path.replace("\\", "/")

        user_folder = os.path.join(USER_PHOTOS_FOLDER, f'user_{len(UserManager.load_data()) + 1}')
        os.makedirs(user_folder, exist_ok=True)
        normalized_user_folder = user_folder.replace("\\", "/")

        data = UserManager.load_data()
        user_id = len(data) + 1

        data[user_id] = {
            'NAME': name,
            'PROFILEPICTURE_PATH': normalized_profile_pic_path,
            'USERPHOTOS_PATH': normalized_user_folder,
            'DRINKS': 0,
            'SHOTS': 0,
            'SCORE': 0
        }
        UserManager.save_data(data)
        session['user_id'] = user_id
        return redirect(url_for('main_page'))

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        data = UserManager.load_data()

        matching_users = [user_id for user_id, user_data in data.items() if user_data['NAME'] == name]

        if len(matching_users) == 1:
            session['user_id'] = matching_users[0]
            return redirect(url_for('main_page'))
        elif len(matching_users) > 1:
            return redirect(url_for('user_select', name=name))
        else:
            return redirect(url_for('register', name=name))

    return render_template('login.html')

@app.route('/userselect/<name>')
def user_select(name):
    data = UserManager.load_data()
    users = [(user_id, user) for user_id, user in data.items() if user['NAME'] == name]

    if not users:
        return redirect(url_for('register'))

    return render_template('userselect.html', users=users)

@app.route('/main', methods=['GET', 'POST'])
def main_page():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('login'))

    data = UserManager.load_data()
    user_data = data.get(user_id)

    if request.method == 'POST':
        drink_type = request.form.get('drink_type')
        photo = request.files.get('photo')

        if not photo or not allowed_file(photo.filename):
            return "Invalid photo upload.", 400

        # Generar un nombre único para la imagen
        original_filename = secure_filename(photo.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()  # Obtener la extensión del archivo
        unique_filename = f"{uuid.uuid4().hex}_{original_filename}"

        # Crear la ruta para guardar la imagen
        photo_path = os.path.join(user_data['USERPHOTOS_PATH'], unique_filename)
        photo.save(photo_path)

        # Actualizar estadísticas según el tipo de bebida
        if drink_type == 'shot':
            user_data['SHOTS'] += 1
            user_data['SCORE'] += 2
        elif drink_type == 'drink':
            user_data['DRINKS'] += 1
            user_data['SCORE'] += 1

        UserManager.save_data(data)

        # Emitir evento de actualización del leaderboard
        sorted_users = sorted(data.values(), key=lambda u: u['SCORE'], reverse=True)
        socketio.emit('update_scoreboard', sorted_users)

        return redirect(url_for('main_page'))

    # Pasar los datos para renderizar la página
    sorted_users = dict(sorted(data.items(), key=lambda x: x[1]['SCORE'], reverse=True))
    top_user = list(sorted_users.values())[0] if sorted_users else None

    return render_template('main.html', user_data=user_data, scoreboard=sorted_users, top_user=top_user)

@app.route('/scoreboard')
def scoreboard():
    data = UserManager.load_data()
    sorted_users = sorted(data.values(), key=lambda u: u['SCORE'], reverse=True)
    return render_template('scoreboard.html', users=sorted_users)

@socketio.on('connect')
def handle_connect():
    data = UserManager.load_data()
    sorted_users = sorted(data.values(), key=lambda u: u['SCORE'], reverse=True)
    socketio.emit('update_scoreboard', sorted_users)

@app.route('/user/<int:user_id>/drinks')
def user_drinks(user_id):
    data = UserManager.load_data()
    user_data = data.get(user_id)

    if not user_data:
        abort(404)

    # Obtener todas las fotos del usuario
    user_photos = []
    if os.path.exists(user_data['USERPHOTOS_PATH']):
        user_photos = [
            os.path.join(user_data['USERPHOTOS_PATH'].split('static/')[1], f).replace("\\", "/")
            for f in os.listdir(user_data['USERPHOTOS_PATH'])
            if allowed_file(f)
        ]

    # Corregir el path de la foto de perfil
    profile_picture_path = user_data['PROFILEPICTURE_PATH'].split('static/')[1]

    return render_template(
        'user_drinks.html',
        user=user_data,
        user_photos=user_photos,
        profile_picture_path=profile_picture_path
    )

def fix_orientation(image_path):
    """
    Corrige la orientación de la imagen basada en los metadatos EXIF.
    """
    try:
        with Image.open(image_path) as img:
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break

            exif = img._getexif()
            if exif is not None:
                orientation = exif.get(orientation)
                if orientation == 3:  # 180 grados
                    img = img.rotate(180, expand=True)
                elif orientation == 6:  # 90 grados en sentido horario
                    img = img.rotate(270, expand=True)
                elif orientation == 8:  # 90 grados en sentido antihorario
                    img = img.rotate(90, expand=True)

            # Guardar la imagen con la orientación corregida
            img.save(image_path)
    except Exception as e:
        print(f"Error al corregir la orientación: {e}")

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", debug=True)

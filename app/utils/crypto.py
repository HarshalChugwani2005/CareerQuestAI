import os
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from app.core.config import get_settings

settings = get_settings()
# Assume ENCRYPTION_KEY is in settings. For now, derive from JWT_SECRET or use a fallback.
KEY = settings.jwt_secret_key.ljust(32)[:32].encode()

def encrypt_pii(data: str) -> str:
    if not data:
        return data
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(KEY), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(data.encode()) + padder.finalize()
    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
    return base64.b64encode(iv + encrypted_data).decode()

def decrypt_pii(encrypted_data: str) -> str:
    if not encrypted_data:
        return encrypted_data
    raw_data = base64.b64decode(encrypted_data)
    iv = raw_data[:16]
    encrypted_payload = raw_data[16:]
    cipher = Cipher(algorithms.AES(KEY), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    unpadder = padding.PKCS7(128).unpadder()
    decrypted_padded = decryptor.update(encrypted_payload) + decryptor.finalize()
    return (unpadder.update(decrypted_padded) + unpadder.finalize()).decode()

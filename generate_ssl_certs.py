import os
import subprocess
import sys

def generate_ssl_certificates():
    """
    Генерирует самоподписанные SSL-сертификаты для разработки
    """
    print("Генерация SSL-сертификатов для разработки...")
    
    # Создаем директорию для сертификатов, если она не существует
    os.makedirs("nginx/ssl", exist_ok=True)
    
    # Пути к файлам сертификатов
    key_path = os.path.join("nginx", "ssl", "inventory.key")
    crt_path = os.path.join("nginx", "ssl", "inventory.crt")
    
    # Команда для генерации самоподписанного сертификата
    openssl_cmd = [
        "openssl", "req", "-x509", "-nodes", "-days", "365", "-newkey", "rsa:2048",
        "-keyout", key_path,
        "-out", crt_path,
        "-subj", "/C=RU/ST=State/L=City/O=Organization/OU=Unit/CN=localhost"
    ]
    
    try:
        # Запуск команды OpenSSL
        subprocess.run(openssl_cmd, check=True)
        print(f"SSL-сертификаты успешно созданы:")
        print(f"- Сертификат: {crt_path}")
        print(f"- Ключ: {key_path}")
        
        # Копирование сертификатов в директорию ssl в корне проекта
        os.makedirs("ssl", exist_ok=True)
        
        # Копирование файлов
        with open(key_path, "rb") as src_key, open(os.path.join("ssl", "inventory.key"), "wb") as dst_key:
            dst_key.write(src_key.read())
        
        with open(crt_path, "rb") as src_crt, open(os.path.join("ssl", "inventory.crt"), "wb") as dst_crt:
            dst_crt.write(src_crt.read())
        
        print("Сертификаты скопированы в директорию ssl/")
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"Ошибка при генерации сертификатов: {e}")
        return False
    except Exception as e:
        print(f"Произошла ошибка: {e}")
        return False

if __name__ == "__main__":
    success = generate_ssl_certificates()
    sys.exit(0 if success else 1) 
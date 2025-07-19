from setuptools import setup, find_packages

setup(
    name="inventory-management-system",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "flask",
        "flask-sqlalchemy",
        "flask-migrate",
        "flask-jwt-extended",
        "flask-marshmallow",
        "flask-cors",
        "celery",
        "redis",
        "psycopg2-binary",
        "python-dotenv",
    ],
) 
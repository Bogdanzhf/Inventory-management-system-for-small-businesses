from flask import Blueprint, request, jsonify

from app.core.auth import token_required
from app.utils.dadata import get_address_suggestions, get_company_suggestions

# Создание Blueprint для интеграций
integrations_bp = Blueprint('integrations', __name__, url_prefix='/integrations')


@integrations_bp.route('/dadata/address', methods=['GET'])
@token_required
def address_suggestions(current_user):
    """Получение подсказок по адресам через Dadata API"""
    query = request.args.get('query', '')
    count = request.args.get('count', 10, type=int)
    
    if not query:
        return jsonify({"message": "Параметр 'query' обязателен"}), 400
    
    suggestions = get_address_suggestions(query, count)
    
    return jsonify({
        "query": query,
        "suggestions": suggestions
    }), 200


@integrations_bp.route('/dadata/company', methods=['GET'])
@token_required
def company_suggestions(current_user):
    """Получение подсказок по организациям через Dadata API"""
    query = request.args.get('query', '')
    count = request.args.get('count', 10, type=int)
    
    if not query:
        return jsonify({"message": "Параметр 'query' обязателен"}), 400
    
    suggestions = get_company_suggestions(query, count)
    
    return jsonify({
        "query": query,
        "suggestions": suggestions
    }), 200 
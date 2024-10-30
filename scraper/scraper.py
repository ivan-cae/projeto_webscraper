import requests
from bs4 import BeautifulSoup
import json
from flask import Flask, jsonify



URL = "https://coinmarketcap.com/pt-br/currencies/bitcoin/"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"}

pagina = requests.get(URL, headers=headers)

soup = BeautifulSoup(pagina.content, "html.parser")

app = Flask(__name__)

@app.route('/preco_bitcoin', methods=['GET'])
def get_preco_bitcoin():
    if pagina.status_code == 200:
        span_preco = soup.find("span", class_="sc-65e7f566-0 clvjgF base-text")
        if span_preco:
            preco_texto = span_preco.text.strip()
            preco_formatado = preco_texto.replace("R$", "").replace(",", "")
            try:
                preco = float(preco_formatado)
                
                return jsonify({'preco': preco})
            except ValueError:
                return "Preço não pode ser convertido para float"
        else:
            return "Preço não encontrado"
    else:
        return "Falha ao puxar os dados"



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000)
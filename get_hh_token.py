import requests

client_id = "VL25CO7MAL1C9GJGUFHR2QEV2KN9I4ADP5ONG5K5F79EHLD704MPVQ5U2KPP6RDT"
client_secret = "PBUOA2ODDQR1FA28HU4U90PT080AL1OPFG7V4NFGBCQLR73H4QKQRKC318KFM1IR"
redirect_uri = "http://localhost:3000/auth"
code = "QCALPJ12U79DFEJL4BK2DQLBMPSPM5F1LD5C3E2EJINH2E3T5S71FBUAA7N667EP"

url = "https://hh.ru/oauth/token"

data = {
    "grant_type": "authorization_code",
    "code": code,
    "client_id": client_id,
    "client_secret": client_secret,
    "redirect_uri": redirect_uri
}

response = requests.post(url, data=data)

if response.status_code == 200:
    tokens = response.json()
    print("access_token:", tokens["access_token"])
    print("refresh_token:", tokens["refresh_token"])
    print("token_type:", tokens["token_type"])
    print("expires_in:", tokens["expires_in"])
else:
    print("Ошибка:", response.status_code)
    print(response.text)
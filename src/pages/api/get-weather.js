function validateCep(cep) {
    if (!/^\d{8}$/.test(cep)) {
        throw new Error("CEP inválido. Certifique-se de que tenha 8 dígitos.");
    }
}

async function fetchCepData(cep) {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) {
        throw new Error("Erro ao buscar dados do CEP");
    }
    const data = await response.json();
    if (data.erro) {
        throw new Error("CEP não encontrado");
    }
    return data;
}

async function fetchWeatherData(location) {
    const API_KEY = "654d7b7a618c88ac14c599e4f7db4770";
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather`;

    const params = new URLSearchParams({
        q: location,
        appid: API_KEY,
        units: "metric",
    });

    const response = await fetch(`${WEATHER_API_URL}?${params}`);
    if (!response.ok) {
        throw new Error("Erro ao buscar dados do clima");
    }

    return await response.json();
}

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { cep } = req.query;

    try {

        validateCep(cep);

        const cepData = await fetchCepData(cep);
        const weatherData = await fetchWeatherData(cepData.localidade);

        const currentDate = new Date();
        const brFormat = currentDate.toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        });

        const responseObject = {
            brFormat,
            cep,
            location: cepData.localidade,
            temp: weatherData.main.temp,
        };

        console.log(responseObject);


        return res.status(200).json(responseObject);
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ error: err.message });
    }
}

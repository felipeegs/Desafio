import { useState, useEffect } from "react";

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(";").shift() : null;
};

const setCookie = (name, value, days = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${JSON.stringify(value)}; expires=${date.toUTCString()}; path=/`;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
};

const updateSearchHistory = (newSearch) => {
  let searchHistory = JSON.parse(getCookie("searchHistory") || "[]");

  const existingIndex = searchHistory.findIndex(entry => entry.cep === newSearch.cep);

  if (existingIndex !== -1) {
    searchHistory[existingIndex] = newSearch;
  } else {
    if (searchHistory.length >= 10) searchHistory.pop();
    searchHistory.unshift(newSearch);
  }

  setCookie("searchHistory", searchHistory);
};

export default function Home() {
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    deleteCookie("searchHistory");
    const history = JSON.parse(getCookie("searchHistory") || "[]");
    setSearchHistory(history);
  }, []);

  const handleSearch = async () => {
    setError(null);
    setAddress(null);

    if (cep.length !== 8) {
      setError("CEP inválido. Deve conter 8 dígitos.");
      return;
    }

    try {
      const response = await fetch(`/api/get-weather?cep=${cep}`);
      if (!response.ok) throw new Error("Erro desconhecido.");

      const data = await response.json();
      setAddress(data);
      updateSearchHistory(data);
      setSearchHistory(prev => {
        const updatedHistory = prev.filter(entry => entry.cep !== data.cep);
        return [data, ...updatedHistory.slice(0, 9)];
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-6 py-8">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-xl w-full">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6 text-center">Procurar Informações do CEP</h1>

        <div className="flex flex-col gap-6">
          <input
            type="text"
            value={cep}
            onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="Digite o CEP"
            className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-lg placeholder-gray-500"
          />
          <button
            onClick={handleSearch}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors"
          >
            Buscar
          </button>
        </div>

        {error && <p className="mt-4 text-center text-red-600 font-medium text-sm">{error}</p>}

        {address && (
          <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-300 text-base sm:text-lg">
            <p className="text-gray-700 mb-2"><strong>CEP:</strong> {address.cep}</p>
            <p className="text-gray-700 mb-2"><strong>Cidade:</strong> {address.location || "Não foi localizado"}</p>
            <p className="text-gray-700 mb-2"><strong>Estado:</strong> {address.localState || "Não foi localizado"}</p>
            <p className="text-gray-700 mb-2"><strong>Temperatura:</strong> {Math.round(address.temp) || "Não foi localizado"}°C</p>
            <p className="text-gray-700"><strong>Data da pesquisa:</strong> {address.brFormat || "Não foi localizado"}</p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Últimas Pesquisas</h2>
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2 text-sm font-semibold">CEP</th>
                <th className="px-4 py-2 text-sm font-semibold">Cidade</th>
                <th className="px-4 py-2 text-sm font-semibold">Estado</th>
                <th className="px-4 py-2 text-sm font-semibold">Temperatura</th>
                <th className="px-4 py-2 text-sm font-semibold">Data da Pesquisa</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {searchHistory.map((entry, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{entry.cep}</td>
                  <td className="px-4 py-3">{entry.location}</td>
                  <td className="px-4 py-3">{entry.localState}</td>
                  <td className="px-4 py-3">{Math.round(entry.temp)}°C</td>
                  <td className="px-4 py-3">{entry.brFormat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

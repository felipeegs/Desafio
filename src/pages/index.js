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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    deleteCookie("searchHistory")
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

  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return { key, direction: prevConfig.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedHistory = [...searchHistory].sort((a, b) => {
    if (sortConfig.key) {
      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];
      if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-200 flex items-center justify-center py-10 px-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-3xl">
        <h1 className="text-2xl font-bold text-blue-700 text-center mb-6">
          Consulta de CEP
        </h1>
        <div className="mb-6">
          <input
            type="text"
            value={cep}
            onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="Digite o CEP (8 dígitos)"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
          <button
            onClick={handleSearch}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Buscar
          </button>
        </div>
        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
        {address && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <p><strong>CEP:</strong> {address.cep}</p>
            <p><strong>Cidade:</strong> {address.location || "Não localizado"}</p>
            <p><strong>Estado:</strong> {address.localState || "Não localizado"}</p>
            <p><strong>Temperatura:</strong> {Math.round(address.temp) || "N/A"}°C</p>
            <p><strong>Data da pesquisa:</strong> {address.brFormat || "Não disponível"}</p>
          </div>
        )}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Histórico de Pesquisas</h2>
          <table className="w-full bg-white border rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                {[
                  { key: "cep", label: "CEP" },
                  { key: "location", label: "Cidade" },
                  { key: "localState", label: "Estado" },
                  { key: "temp", label: "Temperatura" },
                  { key: "brFormat", label: "Data da Pesquisa" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => handleSort(key)}
                  >
                    {label} {sortConfig.key === key && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-4">
                    Nenhuma pesquisa realizada.
                  </td>
                </tr>
              ) : (
                sortedHistory.map((entry, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-100"
                  >
                    <td className="px-4 py-2">{entry.cep}</td>
                    <td className="px-4 py-2">{entry.location}</td>
                    <td className="px-4 py-2">{entry.localState}</td>
                    <td className="px-4 py-2">{Math.round(entry.temp)}°C</td>
                    <td className="px-4 py-2">{entry.brFormat}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

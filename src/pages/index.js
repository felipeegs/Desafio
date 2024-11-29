import { useState } from "react";

export default function Home() {
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    setError(null);
    setAddress(null);

    if (cep.length !== 8) {
      setError("CEP inválido. Deve conter 8 dígitos.");
      return;
    }

    try {
      const response = await fetch(`/api/get-weather?cep=${cep}`);
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Erro desconhecido.");
      }

      const data = await response.json();
      setAddress(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8 max-w-full sm:max-w-md w-full">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 text-center">
          Procurar Informações do CEP
        </h1>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={cep}
            onChange={(e) => {
              const formattedCep = e.target.value.replace(/\D/g, "");
              setCep(formattedCep.slice(0, 8));
            }}
            placeholder="Digite o CEP"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <button
            onClick={handleSearch}
            className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base hover:bg-blue-700 transition-colors"
          >
            Buscar
          </button>
        </div>
        {error && (
          <p className="mt-4 text-center text-red-500 font-medium text-sm sm:text-base">
            {error}
          </p>
        )}
        {address && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm sm:text-base">
            <p className="text-gray-700">
              <strong>CEP: </strong> {address.cep}
            </p>
            <p className="text-gray-700">
              <strong>Cidade: </strong> {address.location || "Não foi localizado"}
            </p>
            <p className="text-gray-700">
              <strong>Estado: </strong> {address.localState || "Não foi localizado"}
            </p>
            <p className="text-gray-700">
              <strong>Temperatura: </strong> {Math.round(address.temp) || "Não foi localizado"}°C
            </p>
            <p className="text-gray-700">
              <strong>Hora da pesquisa: </strong> {address.brFormat || "Não foi localizado"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

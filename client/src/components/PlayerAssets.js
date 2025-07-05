import React from 'react';

function PlayerAssets({ assets }) {
  // Se non abbiamo dati, non mostriamo nulla
  if (!assets) return null;

  const { units, buildings } = assets;

  return (
    <div className="w-full max-w-4xl bg-gray-700 p-4 mt-4 rounded-lg shadow-md">
      <h2 className="text-xl text-white font-semibold mb-3">Le Tue Forze</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Colonna Unità */}
        <div>
          <h3 className="text-lg text-yellow-400">Unità</h3>
          <ul className="list-disc list-inside text-gray-200">
            {Object.entries(units).map(([name, value]) => (
              <li key={name}>
                <span className="capitalize">{name}:</span>
                <span className="font-bold ml-2">{value}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonna Edifici */}
        <div>
          <h3 className="text-lg text-yellow-400">Edifici</h3>
          <ul className="list-disc list-inside text-gray-200">
            {Object.entries(buildings).map(([name, value]) => (
              <li key={name}>
                <span className="capitalize">{name}:</span>
                <span className="font-bold ml-2">{value}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}

export default PlayerAssets;
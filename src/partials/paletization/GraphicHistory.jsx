import React, { useEffect, useState } from 'react';
import BarChart from '../../charts/BarChart01';

// Import utilities
import { tailwindConfig } from '../../utils/Utils';

function GraphicHistory() {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    fetch('http://10.13.225.20:8004/api/v1/paletization/graph/')
      .then(response => response.json())
      .then(data => {
        // Procesar los datos recibidos para adaptarlos a la estructura de la gráfica
        const formattedData = {
          labels: data.map(entry => entry.date),
          datasets: [
            {
              label: 'Cantidad de pallets',
              data: data.map(entry => entry.count),
              backgroundColor: '#009B4A', // Color de las barras
              hoverBackgroundColor: '#009B4A', // Color al pasar el mouse
              barPercentage: 1,
              categoryPercentage: 0.66,
            },
          ],
        };
        setChartData(formattedData);
      })
      .catch(error => console.error('Error al obtener los datos de la API:', error));
  }, []);

  useEffect(() => {
    // Esto no hace nada, pero el cambio de estado activa este efecto secundario
    console.log(chartData)
  }, [chartData]);

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 bg-white rounded-sm mt-4">
      {/* Chart built with Chart.js 3 */}
      {/* Change the height attribute to adjust the chart height */}
      <BarChart data={chartData} width={955} height={248} />
    </div>
  );
}

export default GraphicHistory;

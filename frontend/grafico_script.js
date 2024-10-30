document.addEventListener('DOMContentLoaded', (event) => {
    let chart;

    async function fetchData() {
        try {
            const response = await fetch('http://localhost:8000/dados_bitcoin');
            if (!response.ok) {
                throw new Error('Falha ao obter resposta');
            }
            const data = await response.json();
            console.log(data);
            return data;
        } catch (error) {
            console.error('erro no fetch:', error);
            throw error;
        }
    }

    async function renderChart() {
        try {
            const data = await fetchData();
            const ctx = document.getElementById('grafico-preco-bitcoin').getContext('2d');

            if (!ctx) {
                throw new Error('Não foi possível obter o contexto do canvas');
            }

            if (chart) {
                // Atualiza o gráfico existente
                chart.data.labels = data.map(entry => new Date(entry.timestamp));
                chart.data.datasets[0].data = data.map(entry => entry.preco);
                chart.update();
            } else {
                // Cria um novo gráfico
                chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.map(entry => new Date(entry.timestamp)),
                        datasets: [{
                            label: 'Preço do Bitcoin',
                            data: data.map(entry => entry.preco),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                            fill: false
                        }]
                    },
                    options: {
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: 'minute'
                                },
                                title: {
                                    display: true,
                                    text: 'Horário'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Valor (R$)'
                                },
                                beginAtZero: false
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('erro na renderizacao:', error);
        }
    }

    renderChart();

    setInterval(renderChart, 60000);
});

document.addEventListener("DOMContentLoaded", function() {
    const listaAcompanhamentos = document.getElementById('lista-acompanhamentos');
    const botaoAddAcompanhamento = document.getElementById('botao-add-acompanhamento');
    const valorBitcoinAtual = document.getElementById('valor-bitcoin-dashboard');
    const botaoGrafico = document.getElementById('botao-grafico');

    function atualizaListaAcompanhamentos() {
        fetch('http://localhost:8000/acompanhamentos/lista')
            .then(response => response.json())
            .then(data => {
                listaAcompanhamentos.innerHTML = ''; // Limpa a lista antes de renderizar novamente
                if (data.length > 0) {
                    data.forEach(Acompanhamento => {
                        const row = document.createElement('tr');
                        var email = null;
                        var tel = null;
                        

                        row.innerHTML = `
                            <td>${Acompanhamento.valor_alerta}</td>
                            <td>${Acompanhamento.alerta_acima ? 'Acima' : 'Abaixo'}</td>
                            <td>${Acompanhamento.notifica_email ? Acompanhamento.email : 'Não'}</td>
                            <td>${Acompanhamento.notifica_sms ? Acompanhamento.telefone : 'Não'}</td>
                        `;

                        const acoes = document.createElement('td');

                        const botaoEdita = document.createElement('button');
                        botaoEdita.textContent = 'Editar';
                        botaoEdita.classList.add('btn', 'btn-primary', 'me-2');
                        botaoEdita.onclick = function() {
                            editarAcompanhamento(Acompanhamento.id);
                        };

                        
                        acoes.appendChild(botaoEdita);

                        const botaoApaga = document.createElement('button');
                        botaoApaga.textContent = 'Apagar';
                        botaoApaga.classList.add('btn', 'btn-danger'); 
                        botaoApaga.onclick = function() {
                            apagarAcompanhamento(Acompanhamento.id);
                        };
                        acoes.appendChild(botaoApaga);

                        row.appendChild(acoes);

                        listaAcompanhamentos.appendChild(row);
                    });
                } else {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="5">Nenhum acompanhamento cadastrado</td>';
                    listaAcompanhamentos.appendChild(row);
                }
            });
    }
    
    function valorBitCoinAtual() {
        fetch('http://localhost:8000/preco_bitcoin')
            .then(response => {
                console.log(response)
                if (!response.ok) {
                    throw new Error('Erro na resposta da rede');
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    console.error('Erro ao buscar o valor do Bitcoin:', data.error);
                } else {
                    document.getElementById('valor-bitcoin-dashboard').textContent = "Valor Atual(R$) " + data;
                }
            })
            .catch(error => {
                console.error('Erro ao buscar o valor do Bitcoin:', error);
            });
    }


    botaoAddAcompanhamento.addEventListener('click', function() {
        window.location.href = 'formulario_acompanhar_cripto.html';
    });

    botaoGrafico.addEventListener('click', function() {
        window.location.href = 'grafico.html';
    });

    atualizaListaAcompanhamentos();

    valorBitCoinAtual();

    document.addEventListener("DOMContentLoaded", function() {
        
        setInterval(valorBitCoinAtual, 60000); // Atualiza a cada minuto
    });
    
    function editarAcompanhamento(id) {
        // Redireciona para a página de edição com o ID passado como query parameter
        window.location.href = `formulario_acompanhar_cripto.html?id=${id}`;
    }
    
    
    function apagarAcompanhamento(id) {
        fetch(`http://localhost:8000/acompanhamentos/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(apagou => {
            if (apagou) {
                alert('Acompanhamento apagado com sucesso!');
                location.reload();
            } else {
                alert('Erro ao apagar acompanhamento.');
            }
        });
    }
});

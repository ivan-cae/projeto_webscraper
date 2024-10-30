document.addEventListener("DOMContentLoaded", function() {
    const formulario = document.getElementById('formulario-acompanhamento');

    const urlParams = new URLSearchParams(window.location.search);
    const acompanhamentoId = urlParams.get('id');
    
    if(acompanhamentoId){
        var botaoSalvar = document.getElementById('cadastrar_acompanhamento');
        botaoSalvar.textContent = 'Salvar';
        console.log('Editando...');
    }

    $(document).ready(function() {
        $('#tel').inputmask({
            mask: '+55 (99) 99999-9999',
            placeholder: ' ',
            clearIncomplete: true
        });
    });

    formulario.addEventListener('submit', function(event) {
        event.preventDefault();
        const valor = document.getElementById('valor').value;
        const alertaValor = document.getElementById('alerta_valor').value;
        const notificaEmail = document.getElementById('check_alerta_email').checked;
        const email = document.getElementById('email').value;
        const notificaSms = document.getElementById('check_alerta_sms').checked;
        const telefone = document.getElementById('tel').value;
        const alertaAcima = alertaValor === 'acima';
        
        console.log(telefone);
        
        const acompanhamento = {
            valor_alerta: parseFloat(valor),
            notifica_email: notificaEmail,
            email: email,
            notifica_sms: notificaSms,
            telefone: telefone,
            alerta_acima: alertaAcima
        };

        if(acompanhamentoId){
            fetch(`http://localhost:8000/acompanhamentos/${acompanhamentoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(acompanhamento),
            })
            .then(response => response.json())
            .then(cadastro => {
                if (cadastro.detail) {
                    alert(cadastro.detail);
                } else {
                    alert('As Alterações foram salvas!');
                    window.location.href = 'index.html'; // Redireciona para a dashboard
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        
        }else{
            

            fetch('http://localhost:8000/acompanhamentos/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(acompanhamento),
            })
            .then(response => response.json())
            .then(cadastro => {
                if (cadastro.detail) {
                    alert(cadastro.detail);
                } else {
                    alert('Acompanhamento cadastrado com sucesso!');
                    window.location.href = 'index.html'; // Redireciona para a dashboard
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }
    });


    
    if (acompanhamentoId) {
        // Buscar os dados do acompanhamento pelo ID
        fetch(`http://localhost:8000/acompanhamentos/${acompanhamentoId}`)
            .then(response => response.json())
            .then(acompanhamentoEdicao => {
                
                console.log(acompanhamentoEdicao);

                var valor = document.getElementById('valor');
                var alertaValor = document.getElementById('alerta_valor');
                var notificaEmail = document.getElementById('check_alerta_email');
                var email = document.getElementById('email');
                var notificaSms = document.getElementById('check_alerta_sms');
                var telefone = document.getElementById('tel');
                


                valor.value = acompanhamentoEdicao.valor_alerta;
                email.value  = acompanhamentoEdicao.email;
                notificaEmail.checked  = acompanhamentoEdicao.notifica_email;
                telefone.value  = acompanhamentoEdicao.telefone;
                notificaSms.checked  = acompanhamentoEdicao.notifica_sms;
                if(!acompanhamentoEdicao.alerta_acima){
                    alertaValor.value  = 'abaixo';
                }
            })
            .catch(error => {
                console.error('Erro ao buscar os dados do acompanhamento:', error);
            });
    }

    
});
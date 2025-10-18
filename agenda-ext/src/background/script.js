document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos ---
    const tituloInput = document.getElementById('titulo-anotacao');
    const corpoInput = document.getElementById('corpo-anotacao');
    const btnAdicionar = document.getElementById('btn-adicionar');
    
    // **SELETOR CORRIGIDO:** Alvo onde as anotações dinâmicas serão injetadas.
    const anotacoesListTarget = document.getElementById('anotacoes-list-target'); 

    // Guardrail para garantir que o alvo existe
    if (!anotacoesListTarget) {
        console.error("Erro: O elemento 'anotacoes-list-target' não foi encontrado no popup.html. Verifique seu HTML.");
        // O script para aqui se não puder renderizar.
        return; 
    }

    // Referência para a API de Storage (exige a permissão 'storage' no manifest.json)
    const storage = chrome.storage.local;

    // --- Funções Assíncronas para Storage ---

    /**
     * Busca as anotações do chrome.storage.local.
     * @returns {Promise<Array>} Um array de objetos de anotações (ou array vazio).
     */
    const getAnotacoes = async () => {
        try {
            const result = await storage.get('anotacoes');
            return result.anotacoes || [];
        } catch (error) {
            console.error("Erro ao carregar anotações do storage:", error);
            return [];
        }
    };

    /**
     * Salva um array de anotações no chrome.storage.local.
     * @param {Array} anotacoes - O array de anotações a ser salvo.
     */
    const salvarAnotacoes = async (anotacoes) => {
        try {
            await storage.set({ anotacoes: anotacoes });
        } catch (error) {
            console.error("Erro ao salvar anotações no storage:", error);
        }
    };

    // --- Funções de Manipulação da UI ---

    /**
     * Cria o elemento HTML para uma anotação e o adiciona à lista.
     * @param {Object} anotacao - O objeto da anotação com {titulo, corpo}.
     * @param {number} index - O índice da anotação no array atual.
     */
    const criarElementoAnotacao = (anotacao, index) => {
        const anotacaoDiv = document.createElement('div');
        anotacaoDiv.classList.add('anotacao');
        anotacaoDiv.setAttribute('data-index', index);

        anotacaoDiv.innerHTML = `
            <div class="anotacao-header">
                <h3>${anotacao.titulo}</h3>
                <div class="anotacao-actions">
                    <button class="btn-action btn-editar" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-excluir" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
            <p>${anotacao.corpo}</p>
        `;

        // Atribui os Event Listeners: É crucial que a função receba o índice ATUAL
        anotacaoDiv.querySelector('.btn-excluir').addEventListener('click', () => excluirAnotacao(index));
        anotacaoDiv.querySelector('.btn-editar').addEventListener('click', () => editarAnotacao(index));

        anotacoesListTarget.appendChild(anotacaoDiv);
    };

    /**
     * Carrega as anotações do storage e renderiza a lista.
     */
    const carregarAnotacoes = async () => {
        const anotacoes = await getAnotacoes();
        
        // Limpa o contêiner alvo antes de renderizar para evitar duplicação
        anotacoesListTarget.innerHTML = ''; 
        
        if (anotacoes.length > 0) {
            anotacoes.forEach((anotacao, index) => {
                criarElementoAnotacao(anotacao, index);
            });
        } else {
             // Mensagem caso não haja anotações salvas
             anotacoesListTarget.innerHTML = '<p style="text-align: center; color: #666; padding: 15px;">Nenhuma anotação salva ainda.</p>';
        }
    };

    /**
     * Adiciona uma nova anotação.
     */
    const adicionarAnotacao = async () => { 
        const titulo = tituloInput.value.trim();
        const corpo = corpoInput.value.trim();

        if (titulo === '' || corpo === '') {
            alert('Por favor, preencha o título e o corpo da anotação.');
            return;
        }

        const anotacoes = await getAnotacoes();
        anotacoes.push({ titulo, corpo });
        await salvarAnotacoes(anotacoes);

        // Limpa os campos
        tituloInput.value = '';
        corpoInput.value = '';

        // Recarrega a lista para refletir a alteração
        await carregarAnotacoes(); 
    };

    /**
     * Exclui uma anotação com base no seu índice.
     */
    const excluirAnotacao = async (index) => { 
        if (confirm('Tem certeza de que deseja excluir esta anotação?')) {
            const anotacoes = await getAnotacoes();
            anotacoes.splice(index, 1); // Remove o item
            await salvarAnotacoes(anotacoes);
            await carregarAnotacoes();
        }
    };

    /**
     * Permite a edição de uma anotação.
     */
    const editarAnotacao = async (index) => { 
        const anotacoes = await getAnotacoes();
        const anotacao = anotacoes[index];

        const novoTitulo = prompt('Edite o título:', anotacao.titulo);
        const novoCorpo = prompt('Edite o corpo da anotação:', anotacao.corpo);

        if (novoTitulo !== null && novoCorpo !== null) {
            const tituloFinal = novoTitulo.trim();
            const corpoFinal = novoCorpo.trim();

            if (tituloFinal === '' || corpoFinal === '') {
                alert('O título e o corpo da anotação não podem ficar vazios.');
                return;
            }

            anotacoes[index] = { titulo: tituloFinal, corpo: corpoFinal };
            await salvarAnotacoes(anotacoes);
            await carregarAnotacoes();
        }
    };

    // --- Event Listeners ---
    btnAdicionar.addEventListener('click', adicionarAnotacao);

    // --- Inicialização ---
    // Inicia o carregamento das anotações ao abrir o popup
    carregarAnotacoes(); 
});
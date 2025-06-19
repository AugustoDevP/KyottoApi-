// Importa as bibliotecas necessárias
require('dotenv').config(); // Carrega as variáveis do arquivo .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Inicializa o aplicativo Express
const app = express();

// --- MIDDLEWARES (Configurações Iniciais) ---
app.use(cors()); // Permite que seu frontend (em localhost) acesse este backend
app.use(express.json()); // Permite que o servidor entenda dados em formato JSON

// --- CONEXÃO COM O MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conexão com o MongoDB estabelecida com sucesso!'))
  .catch(err => console.error('Falha ao conectar com o MongoDB:', err));

// --- MODELO DE DADOS (Schema) ---
// Define como um "jogo" deve ser estruturado no banco de dados
const gameSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true }, // Index para pesquisas mais rápidas
  image: { type: String, required: true },
  platform: { type: String, required: true },
  link: { type: String, required: true }
}, { timestamps: true }); // Adiciona campos createdAt e updatedAt automaticamente

const Game = mongoose.model('Game', gameSchema);

// --- ROTAS DA API (Os "caminhos" que o frontend vai chamar) ---

// ROTA TESTE: Para verificar se o servidor está no ar
app.get('/', (req, res) => {
  res.send('API da Kyotto Projects no ar!');
});

/**
 * ROTA: Adicionar um novo jogo (Protegida)
 * URL: POST /api/games
 */
app.post('/api/games', async (req, res) => {
  // Pega a chave secreta do cabeçalho da requisição
  const secret = req.header('x-admin-secret-key');

  if (secret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ message: 'Acesso não autorizado. Chave inválida.' });
  }

  try {
    const { title, image, platform, link } = req.body;
    
    // Validação simples
    if (!title || !image || !platform || !link) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const newGame = new Game({ title, image, platform, link });
    await newGame.save();
    res.status(201).json({ message: 'Jogo adicionado com sucesso!', game: newGame });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar o jogo.', error: error.message });
  }
});

/**
 * ROTA: Buscar jogos
 * URL: GET /api/games/search?q=termo_de_busca
 */
app.get('/api/games/search', async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    
    // Se não houver termo de busca, retorna os 6 mais recentes
    if (!searchTerm) {
        const initialGames = await Game.find().sort({ createdAt: -1 }).limit(6);
        return res.status(200).json(initialGames);
    }
      
    // Cria uma expressão regular para busca "case-insensitive" (não diferencia maiúsculas de minúsculas)
    const searchRegex = new RegExp(searchTerm, 'i');
    const foundGames = await Game.find({ title: searchRegex }).limit(20); // Limita a 20 resultados por segurança

    res.status(200).json(foundGames);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar jogos.', error: error.message });
  }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

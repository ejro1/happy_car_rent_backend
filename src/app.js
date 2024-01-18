const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors')

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

//Función para obtener la ciudad actual basada en coordenada

async function getCidadeAtual(lat, lng) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDNLZLEt6nETJuw-9pPL84Qd6JEtLrQWio`
      );
  
      const result = response.data.results[0];
  
      if (result) {
        const cidade = result.address_components.find(component =>
          component.types.includes('locality')
        );
  
        return cidade ? cidade.long_name : null;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao obter cidade atual:', error.message);
      return null;
    }
  }


app.post('/api/getCity', async (req, res) => {
  const { latitude, longitude } = req.body;

  try {
      const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyDNLZLEt6nETJuw-9pPL84Qd6JEtLrQWio`
      );

      const city = response.data.results[0].address_components[3].long_name;

      res.json({ city });
  } catch (error) {
      console.error('Error ao obtr a cidade desde Google Maps:', error);
      res.status(500).json({ error: 'Error interno do servidor' });
  }
});

app.get('/inicio', async (req, res) => {
  const { lat, lng } = req.query;

  if (lat && lng) {
      try {
          const cidadeAtual = await getCidadeAtual(lat, lng);
          res.json({ cidadeAtual });
      } catch (error) {
          res.status(500).json({ error: 'Error interno do servidor ao obter a cidade' });
      }
  } else {
      res.status(400).json({ error: 'Coordenadas GPS ausentes' });
  }
});


// Rota para a página "Lojas"
app.get('/loja', async (req, res) => {
  try {
    const lojas = await prisma.loja.findMany();
    res.json(lojas);
  } catch (error) {
    console.error('Erro ao obter dados das lojas:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para a página "Frota"
app.get('/frota', async (req, res) => {
  try {
    const frotas = await prisma.frota.findMany();
    res.json(frotas);
  } catch (error) {
    console.error('Erro ao obter dados da frota:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/loja/:id/carros', async (req, res) => {
  const lojaId = parseInt(req.params.id);

  try {
    const carrosLoja = await prisma.carroLoja.findMany({
      where: {
        lojaId: lojaId
      },
      include: {
        carro: true
      }
    });

    // Extraer los carros de la respuesta de la base de datos
    const carros = carrosLoja.map(item => item.carro);

    res.json(carros);
  } catch (error) {
    console.error('Erro ao obter dados da frota:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});




app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

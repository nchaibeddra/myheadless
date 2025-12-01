const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de multer pour gérer les uploads d'images
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route pour vérifier le statut du serveur
app.get('/status', (req, res) => {
  res.json({ status: 'Serveur en cours d\'exécution', timestamp: new Date() });
});

// Routes pour les plats
app.get('/plats', async (req, res) => {
  try {
    const plats = await prisma.plat.findMany();
    res.json(plats);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des plats' });
  }
});

app.post('/plats', upload.single('image'), async (req, res) => {
  try {
    const { titre, description, prix, imageAlt } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const plat = await prisma.plat.create({
      data: {
        titre,
        description,
        prix: parseFloat(prix),
        imageUrl,
        imageAlt
      }
    });
    res.status(201).json(plat);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du plat' });
  }
});

app.get('/plats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plat = await prisma.plat.findUnique({
      where: { id: parseInt(id) }
    });
    if (!plat) {
      return res.status(404).json({ error: 'Plat non trouvé' });
    }
    res.json(plat);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du plat' });
  }
});

app.put('/plats/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, description, prix, imageAlt } = req.body;

    const data = { titre, description, prix: parseFloat(prix), imageAlt };

    if (req.file) {
      data.imageUrl = `/uploads/${req.file.filename}`;
    }

    const plat = await prisma.plat.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(plat);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du plat' });
  }
});

app.delete('/plats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.plat.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du plat' });
  }
});

// Routes pour les collections
app.get('/collections', async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      include: { plats: true }
    });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des collections' });
  }
});

app.post('/collections', async (req, res) => {
  try {
    const { nom, description } = req.body;
    const collection = await prisma.collection.create({
      data: { nom, description }
    });
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la collection' });
  }
});

app.get('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(id) },
      include: { plats: true }
    });
    if (!collection) {
      return res.status(404).json({ error: 'Collection non trouvée' });
    }
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la collection' });
  }
});

app.put('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description } = req.body;
    const collection = await prisma.collection.update({
      where: { id: parseInt(id) },
      data: { nom, description }
    });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la collection' });
  }
});

app.delete('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.collection.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la collection' });
  }
});

// Routes pour associer un plat à une collection
app.post('/collections/:collectionId/plats/:platId', async (req, res) => {
  try {
    const { collectionId, platId } = req.params;

    // Vérifier si le plat et la collection existent
    const plat = await prisma.plat.findUnique({
      where: { id: parseInt(platId) }
    });

    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(collectionId) }
    });

    if (!plat || !collection) {
      return res.status(404).json({ error: 'Plat ou collection non trouvé' });
    }

    // Ajouter le plat à la collection
    await prisma.collection.update({
      where: { id: parseInt(collectionId) },
      data: {
        plats: {
          connect: { id: parseInt(platId) }
        }
      }
    });

    res.status(201).json({ message: 'Plat ajouté à la collection' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du plat à la collection' });
  }
});

// Routes pour dissocier un plat d'une collection
app.delete('/collections/:collectionId/plats/:platId', async (req, res) => {
  try {
    const { collectionId, platId } = req.params;

    // Vérifier si le plat et la collection existent
    const plat = await prisma.plat.findUnique({
      where: { id: parseInt(platId) }
    });

    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(collectionId) }
    });

    if (!plat || !collection) {
      return res.status(404).json({ error: 'Plat ou collection non trouvé' });
    }

    // Retirer le plat de la collection
    await prisma.collection.update({
      where: { id: parseInt(collectionId) },
      data: {
        plats: {
          disconnect: { id: parseInt(platId) }
        }
      }
    });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du plat de la collection' });
  }
});

// Servir les fichiers statiques de l'interface web
app.use(express.static(path.join(__dirname, 'public')));

// Route pour servir l'interface web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Accède à http://localhost:${PORT} pour utiliser l'interface de gestion.`);
});

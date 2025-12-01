document.addEventListener('DOMContentLoaded', () => {
    // Charger les plats et collections au démarrage
    loadPlats();
    loadCollections();

    // Gestion du formulaire des plats
    const platForm = document.getElementById('plat-form');
    platForm.addEventListener('submit', handlePlatFormSubmit);

    // Gestion du formulaire des collections
    const collectionForm = document.getElementById('collection-form');
    collectionForm.addEventListener('submit', handleCollectionFormSubmit);

// Charger les plats
    async function loadPlats(searchTerm = '') {
        const response = await fetch('/plats');
        let plats = await response.json();
        const platsList = document.getElementById('plats-list');
        platsList.innerHTML = '';

        // Filtrer les plats en fonction du terme de recherche
        if (searchTerm) {
            plats = plats.filter(plat =>
                plat.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                plat.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        plats.forEach(plat => {
            const platCard = document.createElement('div');
            platCard.className = 'plat-card';
            platCard.dataset.platId = plat.id;
            platCard.draggable = true;
            platCard.addEventListener('dragstart', handleDragStart);

            platCard.innerHTML = `
                <div class="plat-info">
                    <h4>${plat.titre}</h4>
                    <p>${plat.description}</p>
                </div>
                <div class="plat-image">
                    ${plat.imageUrl ? `<img src="${plat.imageUrl}" alt="${plat.imageAlt || 'Image du plat'}">` : '<div class="no-image">Pas d\'image</div>'}
                </div>
            `;
            platsList.appendChild(platCard);
        });
    }

    // Charger les collections
    async function loadCollections() {
        const response = await fetch('/collections');
        const collections = await response.json();
        const collectionsList = document.getElementById('collections-list');
        collectionsList.innerHTML = '';

        for (const collection of collections) {
            const collectionItem = document.createElement('div');
            collectionItem.className = 'collection-item';
            collectionItem.dataset.collectionId = collection.id;
            collectionItem.addEventListener('dragover', handleDragOver);
            collectionItem.addEventListener('drop', (e) => handleDrop(e, collection.id));

            const collectionHeader = document.createElement('div');
            collectionHeader.className = 'collection-header';
            collectionHeader.innerHTML = `
                <h4>${collection.nom}</h4>
                <button onclick="deleteCollection(${collection.id})">Supprimer</button>
            `;

            const collectionPlatsDiv = document.createElement('div');
            collectionPlatsDiv.className = 'collection-plats';
            collectionPlatsDiv.id = `collection-plats-${collection.id}`;

            collectionItem.appendChild(collectionHeader);
            collectionItem.appendChild(collectionPlatsDiv);
            collectionsList.appendChild(collectionItem);

            // Charger les plats de cette collection
            await loadCollectionPlats(collection.id);
        }
    }

    // Charger les plats d'une collection
    async function loadCollectionPlats(collectionId) {
        const response = await fetch(`/collections/${collectionId}`);
        const collection = await response.json();
        const collectionPlatsDiv = document.getElementById(`collection-plats-${collectionId}`);
        collectionPlatsDiv.innerHTML = '';

        if (collection.plats && collection.plats.length > 0) {
            collection.plats.forEach(plat => {
                const platItem = document.createElement('div');
                platItem.className = 'collection-plat';
                platItem.innerHTML = `
                    <span>${plat.titre}</span>
                    <button onclick="removePlatFromCollection(${collectionId}, ${plat.id})">Retirer</button>
                `;
                collectionPlatsDiv.appendChild(platItem);
            });
        } else {
            collectionPlatsDiv.innerHTML = '<p>Aucun plat dans cette collection.</p>';
        }
    }

    // Gestion du formulaire des plats
    async function handlePlatFormSubmit(e) {
        e.preventDefault();

        const platId = document.getElementById('plat-id').value;
        const titre = document.getElementById('titre').value;
        const description = document.getElementById('description').value;
        const prix = document.getElementById('prix').value;
        const imageAlt = document.getElementById('image-alt').value;
        const imageInput = document.getElementById('image');
        const imageFile = imageInput.files[0];

        const formData = new FormData();
        formData.append('titre', titre);
        formData.append('description', description);
        formData.append('prix', prix);
        formData.append('imageAlt', imageAlt);
        if (imageFile) {
            formData.append('image', imageFile);
        }

        if (platId) {
            // Mise à jour d'un plat existant
            const response = await fetch(`/plats/${platId}`, {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                alert('Plat mis à jour avec succès !');
                loadPlats();
                loadCollections();
                hidePlatForm();
            } else {
                alert('Erreur lors de la mise à jour du plat.');
            }
        } else {
            // Création d'un nouveau plat
            const response = await fetch('/plats', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Plat ajouté avec succès !');
                loadPlats();
                hidePlatForm();
            } else {
                alert('Erreur lors de l\'ajout du plat.');
            }
        }
    }

    // Gestion du formulaire des collections
    async function handleCollectionFormSubmit(e) {
        e.preventDefault();

        const collectionId = document.getElementById('collection-id').value;
        const nom = document.getElementById('collection-nom').value;
        const description = document.getElementById('collection-description').value;

        const data = { nom, description };

        if (collectionId) {
            // Mise à jour d'une collection existante
            const response = await fetch(`/collections/${collectionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Collection mise à jour avec succès !');
                loadCollections();
                hideCollectionForm();
            } else {
                alert('Erreur lors de la mise à jour de la collection.');
            }
        } else {
            // Création d'une nouvelle collection
            const response = await fetch('/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Collection ajoutée avec succès !');
                loadCollections();
                hideCollectionForm();
            } else {
                alert('Erreur lors de l\'ajout de la collection.');
            }
        }
    }

    // Fonction pour supprimer une collection
    window.deleteCollection = async function(collectionId) {
        if (confirm('Voulez-vous vraiment supprimer cette collection ?')) {
            const response = await fetch(`/collections/${collectionId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Collection supprimée avec succès !');
                loadCollections();
            } else {
                alert('Erreur lors de la suppression de la collection.');
            }
        }
    };

    // Fonction pour retirer un plat d'une collection
    window.removePlatFromCollection = async function(collectionId, platId) {
        const response = await fetch(`/collections/${collectionId}/plats/${platId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Plat retiré de la collection avec succès !');
            loadCollectionPlats(collectionId);
            loadPlats();
        } else {
            alert('Erreur lors du retrait du plat de la collection.');
        }
    };

    // Fonction pour afficher le formulaire d'ajout de plat
    window.showAddPlatForm = function() {
        document.getElementById('plat-form-title').textContent = 'Ajouter un Plat';
        document.getElementById('plat-form').reset();
        document.getElementById('plat-id').value = '';
        document.getElementById('plat-form-overlay').style.display = 'block';
        document.getElementById('plat-form').style.display = 'block';
    };

    // Fonction pour masquer le formulaire d'ajout de plat
    window.hidePlatForm = function() {
        document.getElementById('plat-form-overlay').style.display = 'none';
        document.getElementById('plat-form').style.display = 'none';
    };

    // Fonction pour afficher le formulaire d'ajout de collection
    window.showAddCollectionForm = function() {
        document.getElementById('collection-form-title').textContent = 'Ajouter une Collection';
        document.getElementById('collection-form').reset();
        document.getElementById('collection-id').value = '';
        document.getElementById('collection-form-overlay').style.display = 'block';
        document.getElementById('collection-form').style.display = 'block';
    };

    // Fonction pour masquer le formulaire d'ajout de collection
    window.hideCollectionForm = function() {
        document.getElementById('collection-form-overlay').style.display = 'none';
        document.getElementById('collection-form').style.display = 'none';
    };

    // Fonction pour rechercher des plats
    window.searchPlats = function() {
        const searchTerm = document.getElementById('search-input').value;
        loadPlats(searchTerm);
    };

    // Ajouter un écouteur d'événement pour la recherche en temps réel
    document.getElementById('search-input').addEventListener('input', function() {
        const searchTerm = this.value;
        loadPlats(searchTerm);
    });

    // Gestion du glisser-déposer
    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.platId);
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    async function handleDrop(e, collectionId) {
        e.preventDefault();
        const platId = e.dataTransfer.getData('text/plain');

        const response = await fetch(`/collections/${collectionId}/plats/${platId}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Plat ajouté à la collection avec succès !');
            loadPlats();
            loadCollectionPlats(collectionId);
        } else {
            alert('Erreur lors de l\'ajout du plat à la collection.');
        }
    }
});

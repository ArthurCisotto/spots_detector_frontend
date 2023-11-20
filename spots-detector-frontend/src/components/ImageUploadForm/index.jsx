import React, { useState } from 'react';
import axios from 'axios';
import { Button, Container, Typography, Box, CircularProgress } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

const ImageUploadForm = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageBase64, setImageBase64] = useState('');
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e) => {
        setSelectedImage(e.target.files[0]);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('image', selectedImage);

        try {
            const response = await axios.post('http://localhost:8000/api/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setImageBase64(response.data.image_base64);
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" gutterBottom>
                Upload de Imagem
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    multiple
                    type="file"
                    onChange={handleImageChange}
                />
                <label htmlFor="raised-button-file">
                    <Button variant="contained" component="span" startIcon={<CloudUploadIcon />} sx={{ mr: 2 }}>
                        Escolher Imagem
                    </Button>
                    {selectedImage ? selectedImage.name : 'Nenhuma imagem selecionada'}
                </label>
                <Button
                    type="submit"
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={!selectedImage || loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Upload'}
                </Button>
            </Box>
            <Typography variant="body1" gutterBottom sx={{ mt: 4 }}>
                <strong>Observações:</strong>
            </Typography>
            <Typography variant="body2" gutterBottom>
                - A precisão do modelo não é 100%. Portanto, é recomendado que você consulte um médico para um diagnóstico mais preciso.
            </Typography>
            <Typography variant="body2" gutterBottom>
                - Se o retângulo ao redor da pinta for <strong>verde</strong>, a pinta provavelmente é benigna. Se for <strong>vermelho</strong>, a pinta provavelmente é maligna e é recomendado que ela seja examinada por um médico.
            </Typography>
            <Typography variant="body2" gutterBottom>
                - Se uma pinta não tiver um retângulo ao redor, o modelo não conseguiu detectá-la.
            </Typography>

            {imageBase64 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Imagem Processada:
                    </Typography>
                    <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Imagem Processada" style={{ maxWidth: '100%', height: 'auto' }} />
                </Box>
            )}

        </Container>
    );
}

export default ImageUploadForm;

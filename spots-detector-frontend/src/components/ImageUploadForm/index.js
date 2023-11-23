import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Button, Container, Typography, Box, CircularProgress } from '@mui/material';
import { CloudUpload as CloudUploadIcon, CameraAlt as CameraAltIcon } from '@mui/icons-material';
import Webcam from "react-webcam";
import ImageCropper from '../ImageCropper';

const ImageUploadForm = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageBase64, setImageBase64] = useState('');
    const [loading, setLoading] = useState(false);
    const [webcamEnabled, setWebcamEnabled] = useState(false);
    const webcamRef = useRef(null);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false); 

    const handleShowCropper = () => {
        setShowCropper(true);
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
            setWebcamEnabled(false);
        }
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();

            reader.addEventListener('load', () =>
                setImageToCrop(reader.result),
                setCroppedImage(null)
            );

            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCapture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        fetch(imageSrc)
            .then(res => res.blob())
            .then(blob => {
                setSelectedImage(new File([blob], "webcam-image.jpg", { type: "image/jpeg" }));
                setImageToCrop(imageSrc);
                setCroppedImage(null);
            });
        setWebcamEnabled(false);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        const imageToSend = croppedImage ? croppedImage : imageToCrop;
        if (!imageToSend) {
            console.error("Nenhuma imagem disponível para upload.");
            setLoading(false);
            return;
        }
    
        const formData = new FormData();
        if (croppedImage) {
            // Se a imagem foi recortada, envie a imagem recortada
            fetch(croppedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
                    formData.append('image', file);
                    sendFormData(formData);
                });
        } else {
            // Se não, envie a imagem original
            formData.append('image', selectedImage);
            sendFormData(formData);
        }
    };
    
    const sendFormData = (formData) => {
        axios.post('http://web-production-b4d5.up.railway.app/api/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then(response => {
            setImageBase64(response.data.image_base64);
        })
        .catch(error => {
            console.error("Erro no upload da imagem:", error);
        })
        .finally(() => {
            setShowCropper(false);
            setLoading(false);
        });  
    };
    
    // ... [resto do componente] ...
    
    return (
        <Container maxWidth="sm">
            <Typography variant="h4" gutterBottom>
                Detecção de Pintas
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
                    {selectedImage ? (typeof selectedImage === 'string' ? 'Imagem da Webcam' : selectedImage.name) : 'Nenhuma imagem selecionada'}
                </label>
                <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                    ou
                </Typography>
                <Button variant="contained" onClick={() => setWebcamEnabled(true)} startIcon={<CameraAltIcon />} sx={{ mr: 2 }}>
                    Tirar Foto
                </Button>
                <Button
                variant="contained"
                onClick={handleShowCropper}
                sx={{ mt: 2, mb: 2 }}
                disabled={!imageToCrop}
                >
                    Cortar Imagem
                </Button>

                {showCropper && (
                    <div>
                        <ImageCropper
                            imageToCrop={imageToCrop}
                            onImageCropped={(croppedImage) => {
                                setCroppedImage(croppedImage);
                            }}
                        />
                    </div>
                )}

                <Button
                    type="submit"
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={!selectedImage || loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Upload'}
                </Button>
                {webcamEnabled && (
                    <Box sx={{ mt: 2 }}>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            style={{ width: '100%', height: 'auto' }}
                        />
                        <Button variant="contained" onClick={handleCapture} sx={{ mt: 2 }}>
                            Capturar Imagem
                        </Button>
                    </Box>
                )}
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
            <Typography variant="body2" gutterBottom>
                - Os <strong>números nos retângulos representam a probabilidade</strong> da pinta pertencer à classe que a cor do retângulo representa. Por exemplo, se o retângulo for verde e o número for 0.9, significa que o modelo tem 90% de certeza de que a pinta é benigna. Se o retângulo for vermelho e o número for 0.4, significa que o modelo tem 40% de certeza de que a pinta é maligna.
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

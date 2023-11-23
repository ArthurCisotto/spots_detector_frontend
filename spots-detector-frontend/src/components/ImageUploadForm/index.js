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
        axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/upload/`, formData, {
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
    
    const styles = {
        container: {
            backgroundColor: '#f5f5f5',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            margin: '20px auto',
        },
        button: {
            backgroundColor: '#4caf50',
            color: 'white',
            '&:hover': {
                backgroundColor: '#388e3c',
            },
            margin: '10px',
        },
        input: {
            display: 'none',
        },
        header: {
            color: '#3f51b5',
            marginBottom: '20px',
            fontWeight: 'bold',
        },
        text: {
            color: '#3f51b5',
            fontSize: 16,
            marginBottom: '20px',
            textAlign: 'justify',
        },
        webcamBox: {
            marginTop: '20px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        },
        imageBox: {
            marginTop: '20px',
            textAlign: 'center',
        },
    };


    return (
        <Container maxWidth="sm" style={styles.container}>
            <Typography variant="h4" style={styles.header}>
                Detecção de Pintas
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <input
                    accept="image/*"
                    style={styles.input}
                    id="raised-button-file"
                    multiple
                    type="file"
                    onChange={handleImageChange}
                />
                <label htmlFor="raised-button-file">
                    <Button variant="contained" component="span" startIcon={<CloudUploadIcon />} style={styles.button}>
                        Escolher Imagem
                    </Button>
                </label>
                <Button variant="contained" onClick={() => setWebcamEnabled(true)} startIcon={<CameraAltIcon />} style={styles.button}>
                    Tirar Foto
                </Button>
                {selectedImage && (
                    <Typography variant="body2" gutterBottom style={{ marginTop: '10px' }}>
                        {typeof selectedImage === 'string' ? 'Imagem da Webcam' : selectedImage.name}
                    </Typography>
                )}
                <Button
                    variant="contained"
                    onClick={handleShowCropper}
                    style={styles.button}
                    disabled={!imageToCrop}
                >
                    Cortar Imagem
                </Button>
                {showCropper && (
                    <ImageCropper
                        imageToCrop={imageToCrop}
                        onImageCropped={(croppedImage) => {
                            setCroppedImage(croppedImage);
                        }}
                    />
                )}
                <Typography variant="h6" gutterBottom style={styles.header}>
                <strong>Observações:</strong>
                </Typography>
                <Typography variant="body2" gutterBottom style={styles.text}>
                    - A precisão do modelo não é 100%. Portanto, é recomendado que você consulte um médico para um diagnóstico mais preciso.
                </Typography>
                <Typography variant="body2" gutterBottom style={styles.text}>
                    - Se o retângulo ao redor da pinta for <strong>verde</strong>, a pinta provavelmente é benigna. Se for <strong>vermelho</strong>, a pinta provavelmente é maligna e é recomendado que ela seja examinada por um médico.
                </Typography>
                <Typography variant="body2" gutterBottom style={styles.text}>
                    - Se uma pinta não tiver um retângulo ao redor, o modelo não conseguiu detectá-la.
                </Typography>
                <Typography variant="body2" gutterBottom style={styles.text}>
                    - Os <strong>números nos retângulos representam a probabilidade</strong> da pinta pertencer à classe que a cor do retângulo representa. Por exemplo, se o retângulo for verde e o número for 0.9, significa que o modelo tem 90% de certeza de que a pinta é benigna. Se o retângulo for vermelho e o número for 0.4, significa que o modelo tem 40% de certeza de que a pinta é maligna.
                </Typography>
                <Button
                    type="submit"
                    fullWidth
                    variant="outlined"
                    style={{ ...styles.button, backgroundColor: 'transparent', color: '#4caf50', border: '1px solid #4caf50', marginTop: '20px' }}
                    disabled={!selectedImage || loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Upload'}
                </Button>
                {webcamEnabled && (
                    <Box style={styles.webcamBox}>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            style={{ width: '100%', height: 'auto' }}
                        />
                        <Button variant="contained" onClick={handleCapture} style={styles.button}>
                            Capturar Imagem
                        </Button>
                    </Box>
                )}
            </Box>
            {imageBase64 && (
                <Box style={styles.imageBox}>
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

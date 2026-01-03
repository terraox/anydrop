import api from './api';

const FileService = {
    uploadFile: async (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);

        return api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onProgress) {
                    onProgress(percentCompleted);
                }
            },
        });
    },

    getAllFiles: async () => {
        return api.get('/files');
    },

    deleteFile: async (id) => {
        return api.delete(`/files/${id}`);
    }
};

export default FileService;

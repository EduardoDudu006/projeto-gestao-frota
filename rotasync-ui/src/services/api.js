import axios from "axios";

const api = axios.create({
    baseURL: "https://projeto-gestao-frota.onrender.com/api", // URL do FastAPI local
});

export default api;

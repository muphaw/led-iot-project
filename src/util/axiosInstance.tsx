import AppConfig from "./config"
import axios, { type AxiosInstance } from "axios";
const base_url = AppConfig.BASE_URL

const API : AxiosInstance = axios.create({
    baseURL : base_url,
    withCredentials : true,
    timeout : 1000,
    headers : {
        'Content-Type' : 'application/json'
    }
})

export default API

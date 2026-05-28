import Manual from "@/pages/Home";
import { createBrowserRouter } from "react-router-dom";


const router = createBrowserRouter([
    {
        path : '/',
        element : <Manual/>
    }
])

export default router
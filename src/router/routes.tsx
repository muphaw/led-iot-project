// import Manual from "@/pages/Home";
import LedController from "@/pages/Home";
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    // element : <Manual/>
    element: <LedController />,
  },
]);

export default router;

import Home from "./page/Home";
import Meet from "./page/Meet";
import Archived from "./component/Archived";
import Landing from "./page/Landing";
import Loading from "./component/loading";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element= {<Landing />} />
      <Route path="/home" element= {<Home />} />
      <Route path="/meet" element= {<Meet />} />
      <Route path="/loading" element= {<Loading />} />
      <Route path="/archived" element={<Archived />} />
    </Routes>
  );
}

export default App;

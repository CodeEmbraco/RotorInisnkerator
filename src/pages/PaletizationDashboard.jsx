
import icons from "../assets/icons/icons";
import Layout from "../components/Layout";
import { useEffect } from "react";

import PaletizationView from "./PaletizationView";
import TabLockedScreen from "../components/TabLockedScreen";
import { useTabLock } from "../hooks/useTabLock";

function PalatizationDashboard() {
  // useEffect(() => {
  //   setTimeout(() => {
  //     localStorage.removeItem("b-gantt-trial-start");
  //     window.location.reload();
  //   }, 60000);

  // }, []);

  const { status, forceTakeover } = useTabLock("paletization");

  if (status === "blocked") {
    return <TabLockedScreen onForce={forceTakeover} />;
  }

  return (
    <Layout
      icon={icons.dashboardIcon}
      nameRoute={"Dashboard"}
      nameSubRoute={"Dashboard"}
    >
        <PaletizationView/>
    </Layout>
  );
}

export default PalatizationDashboard;
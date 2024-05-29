import icons from "../assets/icons/icons";
import { useEffect, useState, useRef } from "react";
import ReactToPrint from "react-to-print";

import {
  Add,
  Barcode,
  Box,
  Box1,
  Category,
  Cd,
  FormatSquare,
  Grid8,
  Hashtag,
  HashtagSquare,
  Health,
  Notepad2,
  Scan,
  Edit,
  Lock,
} from "iconsax-react";

import Stepper from "@keyvaluesystems/react-vertical-stepper";

import GraphicHistory from "../partials/paletization/GraphicHistory";

import useScanDetection from "use-scan-detection";

import { useSelector, useDispatch } from "react-redux";

import ModalBlank from "../components/ModalBlank";

import {
  selectOrderSelected,
  metadataOrderSelected,
} from "../store/slice/orderSelectedSlice";

import {
  addEventToPaletizationLog,
  selectPaletizationLog,
} from "../store/slice/eventsLogSlice";
import {
  getTestResults,
  selectTestResults,
  selectGlobalStatus,
  setGlobalStatus,
  setTestResults,
} from "../store/slice/testResultSlice";
import {
  getLastPallet,
  createPallet,
  selectPallet,
  selectComponents,
  mountComponent,
  processInSAP,
  getCompressor,
  setComponentsJoined,
  setComponents,
  selectLoadingProcessInSap,
  selectPalletNotified,
} from "../store/slice/palletsSlice";
import LabelPrinting from "../partials/genealogy/LabelPrinting";
import ComponentsTable from "../partials/paletization/ComponentsTable";

import {
  notifyPalletScanned,
  notifyProductScanned,
} from "../partials/paletization/Toasts";

function PaletizationView() {
  const [dangerDiffValues, setDangerDiffValues] = useState(false);
  const [confirmEditDiffValues, setConfirmEditDiffValues] = useState(false);
  const [dangerEditQtyPalletModalOpen, setDangerEditQtyPalletModalOpen] =
    useState(false);
  const [confirmEditQtyPallet, setConfirmEditQtyPallet] = useState(false);
  const [value, setValue] = useState("1452");
  const [editable, setEditable] = useState(false); // Cambié el estado inicial a 'false'
  const inputRef = useRef(null);

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const toggleEditable = (e) => {
    e.stopPropagation();
    setDangerEditQtyPalletModalOpen(true);
  };

  useEffect(() => {
    if (confirmEditQtyPallet) {
      setEditable(!editable); // Invierte el estado de editable
      if (!editable) {
        inputRef.current.focus(); // Pone en foco el input cuando se activa la edición
      }
      setConfirmEditQtyPallet(false); //
    } else {
      console.log("No confirmó edición");
    }
  }, [confirmEditQtyPallet]);



  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      setEditable(false); // Bloquea el input si se presiona la tecla Enter
    }
  };

  const handleSave = () => {
    setEditable(false); // Bloquea el input cuando se guarda
  };

  const [totalMontadosValue, setTotalMontadosValue] = useState("");
  const [totalMontadosEditable, setTotalMontadosEditable] = useState(false); // Cambié el estado inicial a 'false'
  const totalMontadosRef = useRef(null);

  const handleChangeMontados = (event) => {
    setTotalMontadosValue(event.target.value);
  };

  const toggleEditableMontados = () => {
    setTotalMontadosEditable(!totalMontadosEditable); // Invierte el estado de editable
    if (!totalMontadosEditable) {
      totalMontadosRef.current.focus(); // Pone en foco el input cuando se activa la edición
    }
  };

  const handleKeyPressMontados = (event) => {
    if (event.key === "Enter") {
      if(value != totalMontadosValue){
        setDangerDiffValues(true);
      }
      setTotalMontadosEditable(false); // Bloquea el input si se presiona la tecla Enter
    }
  };

  const handleSaveMontados = () => {
    if(value != totalMontadosValue){
      setDangerDiffValues(true);
    }
    setTotalMontadosEditable(false); // Bloquea el input si se presiona la tecla Enter
  };

  const testResultsList = useSelector(selectTestResults);
  const globalStatus = useSelector(selectGlobalStatus);
  const orderSelected = useSelector(selectOrderSelected);
  const metadata = useSelector(metadataOrderSelected);
  const paletizationLog = useSelector(selectPaletizationLog);
  const palletNotified = useSelector(selectPalletNotified);

  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const [barcodePallet, setBarcodePallet] = useState("Nuevo pallet");
  const [idAuto, setIdAuto] = useState(1);
  const [barcodeProduct, setBarcodeProduct] = useState("Escanea producto");

  const [treeData, setTreeData] = useState([]);

  const dispatch = useDispatch();

  const labelRef = useRef();

  const [selectedItems, setSelectedItems] = useState([]);

  const palletSelected = useSelector(selectPallet);

  const componentsList = useSelector(selectComponents);

  const isLoading = useSelector(selectLoadingProcessInSap);

  const handleSelectedItems = (selectedItems) => {
    setSelectedItems([...selectedItems]);
  };

  useScanDetection({
    onComplete: async (code) => {
      console.log(code);
      if (code.replace(/Shift/g, "").toUpperCase() === "NEW") {
        handleNew();
        return;
      }

      // Si la cadena es más corta, considerarla un ID de pallet
      const codeScannedEvent = {
        text: "Pallet escaneado: " + code.replace(/Shift/g, "").toUpperCase(),
        timestamp: new Date().toISOString(),
      };
      setBarcodePallet(code.replace(/Shift/g, "").toUpperCase());
      dispatch(addEventToPaletizationLog(codeScannedEvent));
      dispatch(createPallet(code.replace(/Shift/g, "").toUpperCase()));

      const createPalletEvent = {
        text:
          "Consultando registro de Pallet: " +
          code.replace(/Shift/g, "").toUpperCase(),
        timestamp: new Date().toISOString(),
      };
      notifyPalletScanned(code.replace(/Shift/g, "").toUpperCase());

      dispatch(addEventToPaletizationLog(createPalletEvent));
    },
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  var stepsArray = [
    {
      label: "Prueba eléctrica",
      description: "Aprobada, sin errores, finalizada hace 14 minutos.",
      status: "visited",
    },
    {
      label: "Prueba de vacío",
      description: "En proceso, iniciada el 9/05/2023 a las 12:30 PM.",
      status: "unvisited",
    },
  ];

  function formatTimestampToDDMMYYYYHHMMSS(timestamp) {
    const date = new Date(timestamp);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  const stylesOverride = {
    LabelTitle: (step, stepIndex) => ({ marginLeft: "8px", fontSize: 15 }),
    ActiveLabelTitle: (step, stepIndex) => ({
      marginLeft: "0px",
      fontSize: 15,
    }),
    LabelDescription: (step, stepIndex) => ({
      marginLeft: "8px",
      fontSize: 13,
    }),
    ActiveLabelDescription: (step, stepIndex) => ({
      marginLeft: "0px",
      fontSize: 13,
    }),
    LineSeparator: (step, stepIndex) => ({ borderRight: "2px solid #dfdff2" }),
    InactiveLineSeparator: (step, stepIndex) => ({
      borderRight: "2px solid #dfdff2",
    }),
    Bubble: (step, stepIndex) => (
      console.log(stepIndex === currentStepIndex),
      console.log(step.status),
      {
        width: "40px",
        height: "40px",
        backgroundColor: step.status === "skipped" ? "red" : "#15B053",
        color: "#fff",
      }
    ),
    ActiveBubble: (step, stepIndex) => ({
      width: "40px",
      height: "40px",
      backgroundColor: step.status === "skipped" ? "red" : "#15B053",
      color: "#fff",
      background: "#15B053",
      border:
        step.status === "skipped" ? "7px solid #ee9090" : "7px solid #A1DFBA",
    }),
    InActiveBubble: (step, stepIndex) => ({
      width: "40px",
      height: "40px",
      backgroundColor: "#F0F1F3",
      color: "#000000",
    }),
  };

  function handleClickNewPallet() {
    getLastPallet()
      .then((result) => {
        const { nuevoIdentificador, id } = result;
        // Hacer algo con el nuevo identificador recibido
        console.log("El nuevo identificador es:", nuevoIdentificador);
        setBarcodePallet(nuevoIdentificador);
        const codeScannedEvent = {
          text: "Nuevo pallet: " + nuevoIdentificador,
          timestamp: new Date().toISOString(),
        };
        dispatch(addEventToPaletizationLog(codeScannedEvent));
        setIdAuto(id);
      })
      .catch((error) => {
        // Manejar cualquier error que pueda ocurrir
        console.error("Hubo un error:", error);
      });
  }

  function handleNew() {
    console.log("Handle new step");
    setBarcodePallet("Nuevo pallet");
    setBarcodeProduct("Escanea producto");
    setValue("1452");
    setTotalMontadosValue("");
    dispatch(setGlobalStatus(""));
    dispatch(setTestResults([]));
    dispatch(setComponentsJoined(false));
    dispatch(setComponents([]));
  }

  function handleNotify() {
    const codeScannedEvent = {
      text: "Creando pallet: " + barcodePallet,
      timestamp: new Date().toISOString(),
    };
    dispatch(addEventToPaletizationLog(codeScannedEvent));
    dispatch(
      createPallet("MX4FA00P", orderSelected.aufnr, orderSelected.matnr, barcodePallet, totalMontadosValue, idAuto)
    );

    setTimeout(() => {
      dispatch(processInSAP(orderSelected, barcodePallet, totalMontadosValue));
    }, 400);
  }

  function buildTreeData(obj) {
    if (typeof obj === "undefined" || Object.keys(obj).length === 0) {
      console.log("Boom undefined");
      return [];
    } else {
      const treeData = [];
      const mainMatnr = obj.matnr.slice(-9); // Obtener los últimos 9 caracteres de matnr

      const parentNode = {
        id: 1,
        label: mainMatnr,
        children: [],
      };

      const childNode = {
        id: 2,
        label: obj.components[0]?.matnr ?? "",
      };

      parentNode.children.push(childNode);
      treeData.push(parentNode);

      return treeData;
    }
  }

  const [expandedNodes, setExpandedNodes] = useState([]);

  const toggleNode = (nodeId) => {
    if (expandedNodes.includes(nodeId)) {
      setExpandedNodes(expandedNodes.filter((id) => id !== nodeId));
    } else {
      setExpandedNodes([...expandedNodes, nodeId]);
    }
  };

  const renderNode = (node) => {
    const isNodeExpanded = expandedNodes.includes(node.id);
    const hasChildNodes = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="tree-node">
        <div
          className={`tree-node__label ${
            hasChildNodes ? "tree-node__label--clickable" : ""
          }`}
          onClick={() => hasChildNodes && toggleNode(node.id)}
        >
          {hasChildNodes && (
            <span
              className={`tree-node__icon ${
                isNodeExpanded
                  ? "tree-node__icon--expanded"
                  : "tree-node__icon--collapsed"
              }`}
            ></span>
          )}
          {node.label}
        </div>
        {isNodeExpanded && hasChildNodes && (
          <div className="tree-node__children">
            {node.children.map((childNode) => renderNode(childNode))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 xl:py-2 md:py-0 w-full max-w-10xl mx-auto">
        <div className="max-w-full mx-4 py-0 sm:mx-auto sm:px-6 lg:px-4">
          <header>
            <div className="xl:mt-8 md:mt-2">
              <div className="flex items-center justify-between h-16 -mb-px">
                <h3 className="text-black xl:text-2xl md:text-xl capitalize font-semibold text-gray-400 tracking-tight">
                  Paletización
                </h3>
                {/* Header: Right side */}
                <div className="flex items-center space-x-3">
                  {Object.keys(orderSelected).length === 0 ? null : (
                    <button
                      onClick={handleNew}
                      className="border border-slate-300 rounded w-32 h-12 text-base flex justify-center font-semibold"
                    >
                      <Add
                        className="mr-2 my-auto bg-transparent"
                        color="black"
                        size={20}
                      />
                      <span className="my-auto text-black font-semibold">
                        Nuevo
                      </span>
                    </button>
                  )}

                  <ReactToPrint
                    trigger={() => (
                      <button
                        onClick={(e) => {}}
                        className={
                          totalMontadosValue.length > 0
                            ? "w-64 h-12 bg-primary rounded text-white text-base flex justify-center hover:bg-green-500"
                            : "w-64 h-12 bg-secondary rounded text-black text-base flex justify-center hover:text-white disabled:pointer-events-none"
                        }
                        disabled={totalMontadosValue.length === 0}
                      >
                        <Barcode
                          className="mr-2 my-auto bg-transparent"
                          color="#ffff"
                          size={20}
                        />
                        <span className="bg-transparent my-auto text-white font-semibold hover:bg-green-500">
                          Imprimir etiqueta
                        </span>
                      </button>
                    )}
                    content={() => labelRef.current}
                  />

                  <div style={{ display: "none" }}>
                    <LabelPrinting
                      ref={labelRef}
                      pallet={
                        barcodePallet != "Nuevo pallet"
                          ? barcodePallet
                          : "Undefined"
                      }
                      qty={totalMontadosValue.length > 0 ? totalMontadosValue : "Undefined"}
                      order={
                        Object.keys(orderSelected).length != 0
                          ? orderSelected.aufnr
                          : "Undefined"
                      }
                      product={
                        Object.keys(orderSelected).length != 0
                          ? orderSelected.matnr
                          : "Undefined"
                      }
                    />
                  </div>

                  {totalMontadosValue.length == 0 &&
                  barcodePallet == "Nuevo pallet" ? null : isLoading ? (
                    <button
                      onClick={
                        handleNotify
                        //
                      }
                      className={
                        "w-64 h-12 btn bg-primary text-white disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed shadow-none"
                      }
                      disabled={true}
                    >
                      <svg
                        className="animate-spin bg-transparent w-4 h-4 fill-current shrink-0 mr-2"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 16a7.928 7.928 0 01-3.428-.77l.857-1.807A6.006 6.006 0 0014 8c0-3.309-2.691-6-6-6a6.006 6.006 0 00-5.422 8.572l-1.806.859A7.929 7.929 0 010 8c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
                      </svg>
                      <span className="bg-transparent my-auto text-white font-semibold">
                        Cargando...
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={
                        handleNotify
                        //
                      }
                      className={
                        palletNotified.ICharg != barcodePallet &&
                        totalMontadosValue.length > 0 &&
                        barcodePallet != "Nuevo pallet"
                          ? "w-64 h-12 bg-primary rounded text-white text-base flex justify-center hover:bg-green-500"
                          : "w-64 h-12 bg-secondary rounded text-black text-base flex justify-center hover:text-white disabled:pointer-events-none"
                      }
                      disabled={
                        palletNotified.ICharg != barcodePallet &&
                        totalMontadosValue.length > 0 &&
                        barcodePallet != "Nuevo pallet"
                          ? false
                          : true
                      }
                    >
                      <span className="bg-transparent my-auto text-white font-semibold">
                        Procesar
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>
          <div className="max-w-full mx-4 py-0 sm:mx-auto">
            <div className="sm:flex sm:space-x-4">
              {Object.keys(orderSelected).length === 0 ? (
                <section className="inline-block align-bottom rounded-lg border border-slate-200 text-left overflow-hidden mb-4 w-full xl:w-1/3 xl:my-4 md:w-1/4 md:my-4">
                  <div className="bg-white xl:p-5 md:p-3">
                    <div className="sm:flex sm:items-start bg-white">
                      <div className="bg-white text-center sm:mt-0 sm:ml-2 sm:text-left">
                        <div className="flex items-center">
                          <Grid8 className="mr-2" color="#A0A2A6" size={20} />
                          <h3 className="bg-white text-md font-medium text-gray">
                            Pallet
                          </h3>
                        </div>
                        <p className="bg-white xl:text-3xl md:text-lg font-bold text-black">
                          {Object.keys(orderSelected).length === 0
                            ? "Selecciona órden"
                            : barcodePallet}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <button
                  onClick={handleClickNewPallet}
                  className="inline-block align-bottom rounded-lg border border-slate-200 text-left overflow-hidden mb-4 w-full xl:w-1/3 xl:my-4 md:w-1/4 md:my-4"
                >
                  <div className="bg-white xl:p-5 md:p-3">
                    <div className="sm:flex sm:items-start bg-white">
                      <div className="bg-white text-center sm:mt-0 sm:ml-2 sm:text-left">
                        <div className="flex items-center">
                          <Grid8 className="mr-2" color="#A0A2A6" size={20} />
                          <h3 className="bg-white text-md font-medium text-gray">
                            Pallet
                          </h3>
                        </div>
                        <p
                          className="bg-white xl:text-3xl md:text-lg font-bold text-black"
                          onClick={handleClickNewPallet}
                        >
                          {Object.keys(orderSelected).length === 0
                            ? "Selecciona órden"
                            : barcodePallet}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              )}

              <section className="inline-block align-bottom rounded-lg border border-slate-200 text-left overflow-hidden mb-4 w-full xl:w-1/3 xl:my-4 md:w-1/4 md:my-4">
                <div className="bg-white xl:p-5 md:p-3">
                  <div className="sm:flex sm:items-start bg-white">
                    <div className="bg-white text-center sm:mt-0 sm:ml-2 sm:text-left">
                      <div className="flex items-center">
                        <Notepad2 className="mr-2" color="#A0A2A6" size={20} />
                        <h3 className="bg-white text-md font-medium text-gray">
                          Órden
                        </h3>
                      </div>

                      <p className="bg-white xl:text-3xl md:text-lg font-bold text-black">
                        {Object.keys(orderSelected).length === 0
                          ? "Selecciona órden"
                          : orderSelected.aufnr}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="inline-block align-bottom rounded-lg border border-slate-200 text-left overflow-hidden mb-4 w-full xl:w-1/3 xl:my-4 md:w-1/4 md:my-4">
                <div className="bg-white xl:p-5 md:p-3">
                  <div className="sm:flex sm:items-start bg-white">
                    <div className="bg-white text-center sm:mt-0 sm:ml-2 sm:text-left">
                      <div className="flex items-center">
                        <HashtagSquare
                          variant="Outline"
                          className="mr-2"
                          color="#A0A2A6"
                          size={20}
                        />
                        <h3 className="bg-white text-md font-medium text-gray">
                          Cantidad pallet
                        </h3>
                      </div>

                      <div className="bg-white xl:text-3xl md:text-lg font-bold text-black flex items-center">
                        <input
                          className="w-36 border border-transparent focus:border-transparent focus:outline-none"
                          type="text"
                          placeholder="Cantidad"
                          ref={inputRef}
                          value={value}
                          onChange={handleChange}
                          onKeyPress={handleKeyPress} // Llama a handleKeyPress cuando se presiona una tecla
                          disabled={!editable}
                        />
                        {editable ? (
                          <button onClick={handleSave} className="ml-2">
                            <Lock color="#A0A2A6" size={20} />
                          </button>
                        ) : (
                          <button onClick={toggleEditable} className="ml-2">
                            <Edit color="#A0A2A6" size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="inline-block align-bottom rounded-lg border border-slate-200 text-left overflow-hidden xl:mb-4 w-full xl:w-1/3 xl:my-4 md:w-1/4 md:my-4">
                <div className="bg-white xl:p-5 md:p-3">
                  <div className="sm:flex sm:items-start bg-white">
                    <div className="bg-white text-center sm:mt-0 sm:ml-2 sm:text-left">
                      <div className="flex items-center">
                        <Health className="mr-2" color="#A0A2A6" size={20} />
                        <h3 className="bg-white text-md font-medium text-gray">
                          Total montados
                        </h3>
                      </div>

                      <div className="bg-white xl:text-3xl md:text-lg font-bold text-black flex items-center">
                        <input
                          className="w-36 border border-transparent focus:border-transparent focus:outline-none"
                          type="text"
                          placeholder="Cantidad"
                          ref={totalMontadosRef}
                          value={totalMontadosValue}
                          onChange={handleChangeMontados}
                          onKeyPress={handleKeyPressMontados} // Llama a handleKeyPress cuando se presiona una tecla
                          disabled={!totalMontadosEditable}
                        />
                        {totalMontadosEditable ? (
                          <button onClick={handleSaveMontados} className="ml-2">
                            <Lock color="#A0A2A6" size={20} />
                          </button>
                        ) : (
                          <button
                            onClick={toggleEditableMontados}
                            className="ml-2"
                          >
                            <Edit color="#A0A2A6" size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="max-w-full mx-4 py-0 sm:mx-auto">
              <div className="sm:flex sm:space-x-4">
                <section className="inline-block align-bottom rounded-lg border border-slate-200 text-left overflow-hidden mb-4 w-full xl:my-4">
                  <div className="bg-white xl:p-5 md:p-3">
                    <div className="sm:flex sm:items-start bg-white">
                      <div className="bg-white text-center sm:mt-0 sm:ml-2 sm:text-left">
                        <div className="flex items-center">
                          <Box1
                            variant="Outline"
                            className="mr-2"
                            color="#A0A2A6"
                            size={20}
                          />
                          <h3 className="bg-white text-md font-medium text-gray">
                            Producto
                          </h3>
                        </div>
                        <p className="bg-white xl:text-3xl md:text-lg font-bold text-black">
                          {Object.keys(orderSelected).length === 0
                            ? "--------"
                            : orderSelected.matnr}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="inline-block align-bottom rounded-lg border border-slate-200 text-left overflow-hidden mb-4 w-full sm:w-1/4 xl:my-4">
                  <div className="bg-white xl:p-5 md:p-3">
                    <div className="sm:flex sm:items-start bg-white">
                      <div className="bg-white text-center sm:mt-0 sm:ml-2 sm:text-left">
                        <div className="flex items-center">
                          <Cd className="mr-2" color="#A0A2A6" size={20} />
                          <h3 className="bg-white text-md font-medium text-gray">
                            Planeado
                          </h3>
                        </div>
                        <p className="bg-white xl:text-3xl md:text-lg font-bold text-black">
                          {Object.keys(orderSelected).length === 0
                            ? "--------"
                            : `${orderSelected.qtdpl}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="inline-block align-bottom rounded-lg border border-slate-200 text-left overflow-hidden mb-4 w-full sm:w-1/4 xl:my-4">
                  <div className="bg-white xl:p-5 md:p-3">
                    <div className="sm:flex sm:items-start bg-white">
                      <div className="bg-white text-center sm:mt-0 sm:ml-2 sm:text-left">
                        <div className="flex items-center">
                          <Cd className="mr-2" color="#A0A2A6" size={20} />
                          <h3 className="bg-white text-md font-medium text-gray">
                            Apuntado
                          </h3>
                        </div>
                        <p className="bg-white xl:text-3xl md:text-lg font-bold text-black">
                          {Object.keys(orderSelected).length === 0
                            ? "--------"
                            : `${orderSelected.qtdpr}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* <section
                style={{
                  maxHeight: "645px",
                  minHeight: "200px",
                  overflowY: "scroll",
                }}
                className="inline-block align-bottom rounded-lg border border-slate-200 text-left overflow-hidden mb-4 w-full xl:my-4 w-3/4"
              >
                <div className="bg-white xl:p-5 md:p-3">
                  <h3 className="bg-white text-md font-medium text-gray">
                    Listado de componentes
                  </h3>
                  <div
                    className="flex justify-start"
                    style={{ marginLeft: "-10px" }}
                  >
                    <ComponentsTable selectedItems={handleSelectedItems} />
                    <div></div>
                  </div>
                </div>
              </section> */}
            </div>
          </div>

          <hr class="solid hidden xl:block" />

          <div className="xl:mt-8 flex">
            <h3 className=" hidden xl:block text-black xl:text-2xl md:text-xl capitalize font-semibold text-gray-400 tracking-tight">
              Información adicional
            </h3>
          </div>

          <div className="sm:flex sm:space-x-4 xl:mt-4 md:mt-0">
            <section
              style={{ height: "245px", overflowY: "scroll" }}
              className="inline-block align-bottom rounded-lg border border-slate-200 text-left mb-4 w-full sm:w-1/3 xl:my-4"
            >
              <div className="bg-white xl:p-5 md:p-3">
                <h3 className="bg-white text-md font-medium text-gray">
                  Log de eventos
                </h3>
                <div
                  className="bg-white text-sm text-black"
                  style={{ maxHeight: "450px", overflowY: "auto" }}
                >
                  {paletizationLog
                    .slice()
                    .reverse()
                    .map((event, index, array) => (
                      <p
                        key={index}
                        style={{ fontWeight: index === 0 ? "bold" : "normal" }}
                      >
                        <span style={{ color: "green" }}>
                          {formatTimestampToDDMMYYYYHHMMSS(event.timestamp)}
                        </span>{" "}
                        - {event.text}{" "}
                      </p>
                    ))}
                </div>
              </div>
            </section>

            <section className="inline-block align-bottom rounded-lg border border-slate-200 text-left mb-4 sm:w-2/3 xl:my-4">
              <div className="bg-white xl:p-5 md:p-3">
                <h3 className="bg-white text-md font-medium text-gray">
                  Histórico
                </h3>
                <div
                  className="bg-white text-sm text-black"
                  style={{ maxHeight: "450px", overflowY: "auto" }}
                >
                  <GraphicHistory />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="m-1.5">
        {/* Start */}

        <ModalBlank
          id="danger-modal"
          modalOpen={dangerEditQtyPalletModalOpen}
          setModalOpen={setDangerEditQtyPalletModalOpen}
        >
          <div className="p-5 flex space-x-4">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-100">
              <svg
                className="w-4 h-4 shrink-0 fill-current text-rose-500"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z" />
              </svg>
            </div>
            {/* Content */}
            <div>
              {/* Modal header */}
              <div className="mb-2">
                <div className="text-lg font-semibold text-slate-800">
                  Editar Cantidad pallet
                </div>
              </div>
              {/* Modal content */}
              <div className="text-sm text-black mb-10">
                <div className="space-y-2">
                  <p>
                    ¿Estás seguro que deseas cambiar la cantidad estándar de unidades por Pallet? La
                    cantidad estándar es 1452, si deseas proceder da click en "Si, editar"
                  </p>
                </div>
              </div>
              {/* Modal footer */}
              <div className="flex flex-wrap justify-end space-x-2">
                <button
                  className="btn-sm border-slate-200 hover:border-slate-300 text-slate-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDangerEditQtyPalletModalOpen(false);
                    setConfirmEditQtyPallet(false);
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="btn-sm bg-rose-500 hover:bg-rose-600 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmEditQtyPallet(true);
                    setDangerEditQtyPalletModalOpen(false);
                  }}
                >
                  Si, editar
                </button>
              </div>
            </div>
          </div>
        </ModalBlank>
        {/* End */}
      </div>

      <div className="m-1.5">
        {/* Start */}

        <ModalBlank
          id="danger-modal"
          modalOpen={dangerDiffValues}
          setModalOpen={setDangerDiffValues}
        >
          <div className="p-5 flex space-x-4">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-100">
              <svg
                className="w-4 h-4 shrink-0 fill-current text-rose-500"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z" />
              </svg>
            </div>
            {/* Content */}
            <div>
              {/* Modal header */}
              <div className="mb-2">
                <div className="text-lg font-semibold text-slate-800">
                  Confirmar edición
                </div>
              </div>
              {/* Modal content */}
              <div className="text-sm text-black mb-10">
                <div className="space-y-2">
                  <p>
                  El total montado difiere de la cantidad estándar definida. La cantidad estándar por pallet son 1452 unidades. ¿Deseas confirmar el cambio y montar solo {totalMontadosValue} unidades? Haz clic en 'Sí' para proceder.
                  </p>
                </div>
              </div>
              {/* Modal footer */}
              <div className="flex flex-wrap justify-end space-x-2">
                <button
                  className="btn-sm border-slate-200 hover:border-slate-300 text-slate-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTotalMontadosValue("");
                    setDangerDiffValues(false);
                    setConfirmEditDiffValues(false);
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="btn-sm bg-rose-500 hover:bg-rose-600 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmEditDiffValues(true);
                    setDangerDiffValues(false);
                  }}
                >
                  Si, proceder
                </button>
              </div>
            </div>
          </div>
        </ModalBlank>
        {/* End */}
      </div>
    </>
  );
}

export default PaletizationView;

import { createAction, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { endpointsCodes } from './endpointCodes';
import { notifyError, notifyErrorInSAP, notifyGenealogyNotFound, notifyProductMounted, notifyProductUnmounted, notifyProductsJoined, notifySuccesInSAP, notifyPalletCreated } from '../../partials/paletization/Toasts';
import { addEventToPaletizationLog } from './eventsLogSlice';
import { getOrderDetail } from './ordersSlice';

const initialState = {
    pallet: {},
    components : [],
    componentsJoined: false,
    genealogyData: {},
    loadingProcessInSap: false,
    palletNotified: {},
    logs: []
}

const palletsSlice = createSlice({
    initialState,
    name: 'pallets',
    extraReducers: (builder) => {
    },
    reducers: {
        setPallet: (state, action) => {
          state.pallet = action.payload;
        },
        setComponents: (state, action) => {
          state.components = action.payload;
        },
        setNotFound: (state, action) => {
            state.notFound = action.payload;
          },
        unmountComponent: (state, action) => {
            const component = action.payload;
            state.components = state.components.filter((component) => component.id !== component.id);
           
        },
        setComponentsJoined: (state, action) => {
          state.componentsJoined = action.payload;
        },
        setGenealogyData: (state, action) => {
          state.genealogyData = action.payload;
        },
        setLoadingProcessInSap: (state, action) => {
          state.loadingProcessInSap = action.payload;
        },
        setPalletNotified: (state, action) => {
          state.palletNotified = action.payload;
        },
        setLogs: (state, action) => {
          state.logs = action.payload;
        }
      },
});

export const {
    setPallet,
    setComponents,
    unmountComponent,
    setComponentsJoined,
    setGenealogyData,
    setLoadingProcessInSap,
    setPalletNotified,
    setLogs
  } = palletsSlice.actions;
  

export const selectPallet = (state) => state.pallets.pallet;

export const selectComponents = (state) => state.pallets.components;

export const selectComponentsJoined = (state) => state.pallets.componentsJoined;

export const selectGenealogyData = (state) => state.pallets.genealogyData;

export const selectLoadingProcessInSap = (state) => state.pallets.loadingProcessInSap;

export const selectPalletNotified = (state) => state.pallets.palletNotified;

export const selectLogs = (state) => state.pallets.logs;

export default palletsSlice.reducer;

export const joinComponents = (payload) => (dispatch) => {
 
  axios
    .post(`http://10.13.225.20:8004/api/v1/genealogy/component/`, payload)
    .then((response) => {
      if (response.status === 201) {
        notifyProductsJoined(payload.condenser_unit_serial)
        dispatch(setComponentsJoined(true));
        
      } 
    })
    .catch((error) => {
      if (error.response.status === 404) {
      } else if (error.response.status == 400){
        dispatch(setComponentsJoined(true));
        dispatch(notifyProductsJoined(payload.condenser_unit_serial));
      }
      console.log(error.response.status);
      // Manejo de errores, si es necesario
    });
    
};

export const getCompressor = (condenserSerial) => async (dispatch) => {
  try {
    console.log("Validando condenser serial");
    const response = await axios.get(`http://10.13.225.20:8004/api/v1/genealogy/component/?condenser_unit_serial=${condenserSerial}`);
    if (response.status === 200) {
      // dispatch(setGenealogyData(response.data));
      // dispatch(setComponentsJoined(true));
      return response.data;
    } else if (response.status === 404) {
      console.log("No se encontró genealogía");
      notifyGenealogyNotFound(condenserSerial);
    }
  } catch (error) {
    console.log("Error al obtener la genealogía", error);
    notifyGenealogyNotFound(condenserSerial);
    // Manejo de errores, si es necesario
  }
};

export const getLastPallet = () => {
  //dispatch(setLoading(true));
  // const startFetchOrders = {
  //   text: 'Obteniendo órdenes desde SAP',
  //   timestamp: new Date().toISOString(),
  // };
  // dispatch(addEvent(startFetchOrders));
  return axios
    .get('http://10.13.225.20:8004/api/v1/paletization/pallets/?workstation=MX4FA00P')
    .then((response) => {
      if (response.status === 200) {
        //dispatch(setLoading(false));
        console.log("Último pallet");
        console.log(response.data);
        const objectResponse = response.data;
        const id = objectResponse.id_auto + 1; // Suma uno al id
        const nuevoIdentificador = "WET" + id.toString().padStart(4, "0");
        return {nuevoIdentificador, id};
        // dispatch(setPallet(response.data));
      }
    })
    .catch((error) => endpointsCodes(error, dispatch, setNotFound));
};


export const createPallet = (workstation, order, product, identifier, quantity, idAuto) => (dispatch) => {
    //dispatch(setLoading(true));
    // const startFetchOrders = {
    //   text: 'Obteniendo órdenes desde SAP',
    //   timestamp: new Date().toISOString(),
    // };
    // dispatch(addEvent(startFetchOrders));
    const palletData = {
        workstation: workstation,
        order: order,
        product: product,
        identifier: identifier,
        quantity: quantity,
        id_auto: idAuto
    }
    axios
      .post('http://10.13.225.20:8004/api/v1/paletization/pallets/', palletData)
      .then((response) => {
        if (response.status === 201) {
          //dispatch(setLoading(false));
          console.log("Pallet creado con éxito:", response.data);
          //dispatch(setCompressorTestResults(response.data.results));
          //console.log(response.data.global_status);
          //dispatch(setGlobalStatus(response.data.global_status));
          dispatch(setPallet(response.data));
          const palletCreated = {
            text: "Pallet creado: " + identifier,
            timestamp: new Date().toISOString(),
          };
          dispatch(addEventToPaletizationLog(palletCreated));
          notifyPalletCreated(identifier)
        } else if (response.status === 200){
        console.log("Se encontró registro de Pallet:", response.data);
        dispatch(setPallet(response.data));
        const palletIdentifier = response.data.identifier;
        console.log(palletIdentifier);
        }
      })
      .catch((error) => endpointsCodes(error, dispatch, setNotFound));
  };

  export const getAllComponents = (palletIdentifier) => (dispatch) => {
    //dispatch(setLoading(true));
    // const startFetchOrders = {
    //   text: 'Obteniendo órdenes desde SAP',
    //   timestamp: new Date().toISOString(),
    // };
    // dispatch(addEvent(startFetchOrders));
    axios
     .get(`http://10.13.225.20:8004/api/v1/paletization/pallets/${palletIdentifier}/components/`)
     .then((response) => {
        if (response.status === 200) {
          //dispatch(setLoading(false));
          console.log(response.data);
          dispatch(setComponents(response.data));
          //console.log(response.data.global_status);
          //dispatch(setGlobalStatus(response.data.global_status));
        }
      })
     .catch((error) => endpointsCodes(error, dispatch, setNotFound));
  }

  export const getLogs = () => (dispatch) => {
    //dispatch(setLoading(true));
    // const startFetchOrders = {
    //   text: 'Obteniendo órdenes desde SAP',
    //   timestamp: new Date().toISOString(),
    // };
    // dispatch(addEvent(startFetchOrders));
    axios
     .get(`http://10.13.225.20:8004/api/v1/paletization/logs/?workstation=MX4FA00P&page=1&page_size=10`)
     .then((response) => {
        if (response.status === 200) {
          //dispatch(setLoading(false));
          console.log(response.data);
          dispatch(setLogs(response.data));
          //console.log(response.data.global_status);
          //dispatch(setGlobalStatus(response.data.global_status));
        }
      })
     .catch((error) => endpointsCodes(error, dispatch, setNotFound));
  }

  export const mountComponent = (payload) => (dispatch) => {
    const palletId = payload.palette;
    const data = {
            pallet_id: payload.palette,
            serial: payload.serial,
            material: payload.material,
            material_type: "-"
    }
    console.log("Montando componente + ", data);
    axios
      .post(`http://10.13.225.20:8004/api/v1/paletization/pallets/${palletId}/components/add/`, data)
      .then((response) => {
        console.log(response.status);
        console.log("MANDANDO A ACTUALIZAR LOS COMPONENTS")
        if (response.status === 201) {
            notifyProductMounted(payload.serial)
            dispatch(getAllComponents(palletId));
        } else {
          dispatch(setError('Hubo un error al montar el componente.'));
        }
      })
      .catch((error) => {
        // Manejo de errores, si es necesario
      });
      
  };
  

  export const unmountComponentAPI = (palletIdentifier, component) => (dispatch) => {
    // Realiza una solicitud DELETE para desmontar el componente
    axios
      .delete(`http://10.13.225.20:8004/api/v1/paletization/pallets/${palletIdentifier}/components/${component.id}/dismount/`)
      .then((response) => {
        if (response.status === 204) {
            notifyProductUnmounted(component.compUnitSerial);
          // La solicitud DELETE se completó con éxito (código de estado 204)
          // Actualiza la lista de componentes
          dispatch(getAllComponents(palletIdentifier));
        }
      })
      .catch((error) => {
        // Maneja los errores, como lo hiciste anteriormente
        endpointsCodes(error, dispatch, setNotFound);
      });
  };

  export const reprocessPallet = (palletIdentifier) => (dispatch) => {
    // Realiza una solicitud DELETE para desmontar el componente
    const data = {
      pallet: palletIdentifier
    }
    axios
      .post(`http://10.13.225.20:8004/api/v1/paletization/reprocess/`, data)
      .then((response) => {
        
        if (response.status === 200) {
          dispatch(setLoadingProcessInSap(false));
          console.log(response.data);
          if (response.data.EMessage === "Process Notification executed successfully") {
            console.log("Notificación exitosa")
            notifySuccesInSAP(xmlData.ICharg, response.data.EMessage);
            const palletHasBeenNotified = {
              text: "Pallet notificado: " + xmlData.ICharg,
              timestamp: new Date().toISOString(),
            };
            dispatch(addEventToPaletizationLog(palletHasBeenNotified));
            dispatch(setPalletNotified({"ICharg": xmlData.ICharg}))
            dispatch(getOrderDetail(orderSelected.aufnr))
          } else {
            dispatch(setLoadingProcessInSap(false));
            console.log("Error!")
            console.log(response.data.EMessage)
            notifyErrorInSAP(xmlData.ICharg, response.data.EMessage);
          }
        }
      })
      .catch((error) => {
        // Maneja los errores, como lo hiciste anteriormente
        endpointsCodes(error, dispatch, setNotFound);
      });
  };


  export const processInSAP = (orderSelected, pallet, n_components) => (dispatch) => {
    dispatch(setLoadingProcessInSap(true));
    const currentDatetime = new Date();
    const currentDate = currentDatetime.toISOString().split('T')[0];
    const currentTime = currentDatetime.toLocaleTimeString('en-US', { hour12: false });
    
    const xmlData = {
      IArbpl: "MX4FA00P",
      IAufnr: orderSelected.aufnr,
      IMatnrDestino: orderSelected.matnr,
      ICharg: pallet,
      IDataProd: currentDate,
      IHoraProd: currentTime,
      IQuantProd: n_components,
      INumin: "G",
      ItJsonInst: null
    };
    console.log(xmlData);
    
  
    axios
      .post(`http://10.13.225.20:8004/api/v1/paletization/pallets/sap/notifiy/`, xmlData)
      .then((response) => {
        console.log("MANDANDO A NOTIFICAR A SAP")
        if (response.status === 200) {
          dispatch(setLoadingProcessInSap(false));
          console.log(response.data);
          if (response.data.EMessage === "Process Notification executed successfully") {
            console.log("Notificación exitosa")
            notifySuccesInSAP(xmlData.ICharg, response.data.EMessage);
            const palletHasBeenNotified = {
              text: "Pallet notificado: " + xmlData.ICharg,
              timestamp: new Date().toISOString(),
            };
            dispatch(addEventToPaletizationLog(palletHasBeenNotified));
            dispatch(setPalletNotified({"ICharg": xmlData.ICharg}))
            dispatch(getOrderDetail(orderSelected.aufnr))
          } else {
            dispatch(setLoadingProcessInSap(false));
            console.log("Error!")
            console.log(response.data.EMessage)
            notifyErrorInSAP(xmlData.ICharg, response.data.EMessage);
          }
        } else {
        }
      })
      .catch((error) => {
        dispatch(setLoadingProcessInSap(false));
        console.log(error);
        notifyErrorInSAP(xmlData.ICharg, error.message);
      });
  }
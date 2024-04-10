import { createAction, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { endpointsCodes } from './endpointCodes';

import { selectEventsLog, addEvent, addEventToPaletizationLog } from './eventsLogSlice';
import { notifiyGettingOrderDetail, notifyError, notifyOrderDetailSuccess } from '../../partials/paletization/Toasts';

import { toast } from 'react-hot-toast';
import { setOrderSelected } from './orderSelectedSlice';

const initialState = {
    openOrdersList: [],
    loading: false,
    orderDetail: {}
  };

export const revertAll = createAction('REVERT_ALL');
export const revertSearch = createAction('REVERT_SEARCH');
const openOrdersSlice = createSlice({
    initialState,
    name: 'openOrders',
    extraReducers: (builder) => {
      builder.addCase(revertAll, () => initialState);
      builder.addCase(revertSearch, (state, action) => {
        state.search = [];
      });
    },
    reducers: {
      setOpenOrdersList: (state, action) => {
        state.openOrdersList = action.payload;
      },
      setLoading: (state, action) => {
        state.loading = action.payload;
      },
      setNotFound: (state, action) => {
        state.notFound = action.payload;
      },
      setOrderDetail: (state, action) => {
        state.orderDetail = action.payload;
      }
  
    },
  });

  export const {
    setOpenOrdersList,
    setLoading,
    setOrderDetail,
    setNotFound
  } = openOrdersSlice.actions;

export const selectOpenOrdersList = (state) => state.openOrders.openOrdersList;
export const selectLoading = (state) => state.openOrders.loading;
export const selectOrderDetail = (state) => state.openOrders.orderDetail;

export default openOrdersSlice.reducer;

export const getOpenOrdersList = () => (dispatch) => {
    //dispatch(setLoading(true));
    // const startFetchOrders = {
    //   text: 'Obteniendo órdenes desde SAP',
    //   timestamp: new Date().toISOString(),
    // };
    // dispatch(addEvent(startFetchOrders));
    axios
      .get('http://10.13.225.20:8001/api/v1/orders')
      .then((response) => {
        if (response.status === 200) {
          //dispatch(setLoading(false));
          const filtered_orders = response.data.filter(elemento => elemento.arbpl === "MX4FA00P");
          console.log(filtered_orders);
          dispatch(setOpenOrdersList(filtered_orders));
        } else {
          notifyError("Ocurrió un error al obtener las órdenes desde SAP.")
        }
      })
      .catch((error) => {
        notifyError("Ocurrió un error al obtener las órdenes desde SAP.")
        endpointsCodes(error, dispatch, setNotFound)});
  };
  

export const getOrderDetail = (orderId) => (dispatch) => {
  //dispatch(setLoading(true));
  // const startFetchOrders = {
  //   text: 'Obteniendo órdenes desde SAP',
  //   timestamp: new Date().toISOString(),
  // };
  // dispatch(addEvent(startFetchOrders));
  const toastGettingOrder = notifiyGettingOrderDetail(orderId)
  const gettingOrderDetail = {
    text: "Actualizando órden: " + orderId,
    timestamp: new Date().toISOString(),
  };
  dispatch(addEventToPaletizationLog(gettingOrderDetail));
  axios
    .get(`http://10.13.225.20:8001/api/v1/order/${orderId}`)
    .then((response) => {
      if (response.status === 200) {
        //dispatch(setLoading(false));
        dispatch(setOrderDetail(response.data));
        dispatch(setOrderSelected(response.data));
        //toast.dismiss(toastGettingOrder);
        const updateOrderDetail = {
          text: "Valor de apuntado actualizado en órden: " + orderId,
          timestamp: new Date().toISOString(),
        };
        dispatch(addEventToPaletizationLog(updateOrderDetail));
        notifyOrderDetailSuccess(orderId)
        const newLote = {
          text: "Ahora puedes iniciar un nuevo lote.",
          timestamp: new Date().toISOString(),
        };
        dispatch(addEventToPaletizationLog(newLote));
      } else {
        notifyError("Ocurrió un error al obtener el detalle de la órden desde SAP.")
        toast.dismiss(toastGettingOrder);
      }
    })
    .catch((error) => {
      notifyError("Ocurrió un error al obtener el detalle de la órden desde SAP.")
      endpointsCodes(error, dispatch, setNotFound)});
      toast.dismiss(toastGettingOrder);
};

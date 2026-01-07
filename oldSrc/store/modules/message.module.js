const getDefaultState = () => {
  return {
    type: null,
    message: null,
  };
};

export default {
  namespaced: true,
  state() {
    return getDefaultState();
  },
  mutations: {
    SUCCESS(state, message) {
      state.type = "success";
      state.message = message;
    },
    INFO(state, message) {
      state.type = "info";
      state.message = message;
    },
    ERROR(state, message) {
      state.type = "error";
      state.message = message;
    },
    WARNING(state, message) {
      state.type = "warning";
      state.message = message;
    },
    CLEAR(state) {
      state.type = null;
      state.message = null;
    },
  },
};

import { createStore } from "vuex";
import message from "./modules/message.module";
import content from "./modules/content";

export default createStore({
  modules: {
    message,
    content
  },
});

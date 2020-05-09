//axiosの設定。
//ベースURLをここで決定
import axios from "axios";

export default axios.create({
  baseURL: "http://localhost:8080/api",
  responseType: "json"
});
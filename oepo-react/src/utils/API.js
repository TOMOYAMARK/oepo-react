//axiosの設定。
//ベースURLをここで決定
import axios from "axios";

export default axios.create({
  baseURL: "http://35.213.0.125:8080",
  responseType: "json"
});
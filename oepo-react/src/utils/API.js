//axiosの設定。
//ベースURLをここで決定
import axios from "axios";

export default axios.create({
  baseURL: "http://34.85.36.109:8080",
  responseType: "json"
});
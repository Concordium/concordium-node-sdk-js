use std::fmt::Display;
use wasm_bindgen::prelude::*;

use crate::types::JsonString;

pub type JsResult<T = JsonString> = Result<T, JsError>;

pub fn to_js_error(error: impl Display) -> JsError {
    JsError::new(&format!("{}", error))
}

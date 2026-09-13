"use client";

import { useContext } from "react";
import { CartContext } from "./CartProvider";

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé sous <CartProvider>");
  return ctx;
}

"use client";

import ShoppingCart from "@/components/store/ShoppingCard";
import Weapons from "@/components/store/Weapons";
import React from "react";

const Store = () => {

  return (
    <div className="pt-8 flex gap-8">
      <Weapons />
      <ShoppingCart/>
    </div>
  );
};

export default Store;

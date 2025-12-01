/**
 * TourTrigger Component
 * Automatically starts the tour for first-time users
 */

"use client";

import { useEffect, useRef } from "react";
import { useTour } from "./TourProvider";
import { useAuth } from "@/app/hooks/useAuth";
import axios from "axios";

export function TourTrigger() {
    // Tour disabled as per requirement
    return null;
}

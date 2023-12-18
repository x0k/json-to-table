import { makeURIComponentCompressor } from "@/lib/string-compressor";
import { RemoteWorkerActor } from "@/lib/worker-actor";
import { makeRemoteActorLogic } from "@/lib/actor";

import { WorkerAction, WorkerActionResult } from "./core";
import AppWorker from "./app-worker?worker";

export const compressor = makeURIComponentCompressor();

export const appWorker = new RemoteWorkerActor<
  WorkerAction,
  WorkerActionResult,
  string
>(makeRemoteActorLogic(String), new AppWorker());
appWorker.start()

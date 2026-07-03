/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ChatInterface from "./components/ChatInterface";

export default function App() {
  return (
    <div className="h-screen w-full bg-slate-100 font-sans">
      <div className="max-w-5xl mx-auto h-full sm:p-4 md:p-6 lg:p-8">
        <div className="h-full bg-white sm:rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}

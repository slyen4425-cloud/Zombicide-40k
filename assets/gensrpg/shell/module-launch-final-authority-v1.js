'use strict';

(function installGensShellModuleLaunchFinalAuthorityV1(){
  const launchService=window.GensShellModuleLaunchV1;

  window.startConfiguredGame=async function(){
    if(!launchService || typeof launchService.activeModule!=="function" || typeof launchService.startModuleSession!=="function")return false;
    const moduleId=launchService.activeModule();
    return launchService.startModuleSession(moduleId);
  };
})();

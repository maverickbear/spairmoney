/**
 * Logger utilitário que só loga em desenvolvimento
 * Remove todos os logs em produção para melhorar performance
 * Funciona tanto no cliente quanto no servidor
 */

const isDevelopment = 
  typeof process !== "undefined" 
    ? process.env.NODE_ENV === "development"
    : typeof window !== "undefined" && window.location.hostname === "localhost";

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // Erros sempre são logados, mas apenas em desenvolvimento mostram stack trace completo
    if (isDevelopment) {
      // Serialize errors properly to avoid empty objects
      const serializedArgs = args.map(arg => {
        // Handle Error instances
        if (arg instanceof Error) {
          return {
            name: arg.name,
            message: arg.message,
            stack: arg.stack,
            ...(arg as any).code && { code: (arg as any).code },
            ...(arg as any).details && { details: (arg as any).details },
            ...(arg as any).hint && { hint: (arg as any).hint },
          };
        }
        
        // Check if it's a Supabase error object (has code, message, details, hint properties)
        if (arg && typeof arg === 'object' && 'code' in arg && 'message' in arg) {
          const errorObj = arg as any;
          return {
            code: errorObj.code ?? null,
            message: errorObj.message ?? null,
            details: errorObj.details ?? null,
            hint: errorObj.hint ?? null,
          };
        }
        
        // Handle plain objects - ensure they're serializable
        if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
          try {
            // Try to serialize to ensure it's not circular
            JSON.stringify(arg);
            return arg;
          } catch {
            // If circular, extract enumerable properties
            const result: Record<string, unknown> = {};
            for (const key in arg) {
              if (Object.prototype.hasOwnProperty.call(arg, key)) {
                try {
                  result[key] = (arg as Record<string, unknown>)[key];
                } catch {
                  result[key] = '[Non-serializable]';
                }
              }
            }
            return result;
          }
        }
        
        return arg;
      });
      console.error(...serializedArgs);
    } else {
      // Em produção, apenas logar erros críticos sem detalhes sensíveis
      const message = args[0] instanceof Error ? args[0].message : String(args[0]);
      console.error(message);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  /**
   * Logger com prefixo para facilitar identificação em logs
   */
  withPrefix: (prefix: string) => ({
    log: (...args: unknown[]) => logger.log(`[${prefix}]`, ...args),
    error: (...args: unknown[]) => logger.error(`[${prefix}]`, ...args),
    warn: (...args: unknown[]) => logger.warn(`[${prefix}]`, ...args),
    info: (...args: unknown[]) => logger.info(`[${prefix}]`, ...args),
    debug: (...args: unknown[]) => logger.debug(`[${prefix}]`, ...args),
  }),
};


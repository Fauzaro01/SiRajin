function errorHandler(err, req, res, next) {
    console.error(err.stack);

    const statusCode = err.status || 500;
    
    const errorResponse = {
        error: {
            status: statusCode,
            name: err.name || 'ServerError',
            message: err.message || 'Terjadi kesalahan pada server',
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    };

    if (err.details) {
        errorResponse.error.details = err.details;
    }

    res.status(statusCode);
    
    if (req.accepts('json')) {
        res.json(errorResponse);
    } 
    else {
        res.render('error', { 
            title: `Error ${statusCode}`,
            error: errorResponse.error 
        });
    }
}

module.exports = errorHandler;
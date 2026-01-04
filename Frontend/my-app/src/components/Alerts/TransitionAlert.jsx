import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import CloseIcon from '@mui/icons-material/Close';

/**
 * TransitionAlert component.
 * Renders a dismissible alert that floats on top of the content.
 * Uses a portal to render directly into the document body.
 */
const TransitionAlert = ({ alert, onClose, autoHideMs = 4000, offsetTop = 72 }) => {
	const [open, setOpen] = useState(false);

    // Controls the visibility of the alert based on the 'alert' prop.
    // Sets a timer to automatically close the alert if 'autoHideMs' is provided.
	useEffect(() => {
		if (alert) {
			setOpen(true);
			if (autoHideMs && autoHideMs > 0) {
				const t = setTimeout(() => {
					setOpen(false);
					if (onClose) onClose();
				}, autoHideMs);
				return () => clearTimeout(t);
			}
		} else {
			setOpen(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [alert]);

	if (!alert) return null;

	const content = (
		<Box sx={{ width: '100%' }}>
			<Collapse in={open}>
				<Alert
					severity={alert.severity}
					action={
						<IconButton
							aria-label="close"
							color="inherit"
							size="small"
							onClick={() => {
								setOpen(false);
								if (onClose) onClose();
							}}
						>
							<CloseIcon fontSize="inherit" />
						</IconButton>
					}
					sx={{ mb: 2 }}
				>
					{alert.message}
				</Alert>
			</Collapse>
		</Box>
	);

    // Renders the alert using a portal to ensure it appears above other elements.
	try {
		return ReactDOM.createPortal(
			<div
				style={{
					position: 'fixed',
					top: typeof offsetTop === 'number' ? `${offsetTop}px` : offsetTop,
					right: 16,
					zIndex: 1400,
					width: 'auto',
					maxWidth: 'calc(100% - 32px)',
					display: 'flex',
					justifyContent: 'center',
					pointerEvents: 'auto',
				}}
			>
				{content}
			</div>,
			typeof document !== 'undefined' ? document.body : null
		);
	} catch (e) {
        // Fallback if portal creation fails (e.g., during server-side rendering).
		return content;
	}
};

export default TransitionAlert;

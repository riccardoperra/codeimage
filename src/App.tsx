import styles from './App.module.css';
import {Frame} from './components/Frame/Frame';

const App = () => {
	return (
		<div class={styles.App}>
			<Frame>Content</Frame>
		</div>
	);
};

export default App;

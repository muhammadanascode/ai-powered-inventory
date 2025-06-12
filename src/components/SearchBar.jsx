import React, { useState } from "react";
import styles from "../styles/SearchBar.module.css"; 

const SearchBar = () => {
    const [query, setQuery] = useState("");

    const handleSearch = () => {
        console.log("Searching for:", query);
        // TODO: Add actual search logic here
    };

    return (
        <div className={styles.searchBar}>
            <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.searchInput}
            />
            <button onClick={handleSearch} className={styles.searchBtn}>
                Search
            </button>
        </div>
    );
};

export default SearchBar;

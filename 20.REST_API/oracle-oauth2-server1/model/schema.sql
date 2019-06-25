--
-- oracle database dump (ems)
--

--
-- Name: oauth_tokens; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

DROP TABLE oauth_tokens;
CREATE TABLE oauth_tokens (
    id NUMBER(19) NOT NULL,
    access_token VARCHAR(256) NOT NULL,
    access_token_expires_on timestamp NOT NULL,
    client_id VARCHAR(256) NOT NULL,
    refresh_token VARCHAR(256) ,
    refresh_token_expires_on timestamp ,
    user_id NUMBER(19) NOT NULL
);


--
-- Name: oauth_clients; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

DROP TABLE oauth_clients;
CREATE TABLE oauth_clients (
    client_id VARCHAR(256) NOT NULL,
    client_secret VARCHAR(256) NOT NULL,
    redirect_uri VARCHAR(256) NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

DROP TABLE oauth_users;
CREATE TABLE oauth_users (
    id NUMBER(19) NOT NULL,
    username VARCHAR(256) NOT NULL,
    password VARCHAR(256) NOT NULL
);


--
-- Name: oauth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE oauth_tokens
    ADD CONSTRAINT oauth_tokens_pkey PRIMARY KEY (id);

CREATE SEQUENCE SEQ_ID INCREMENT BY 1 START WITH 10000;

--
-- Name: oauth_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (client_id, client_secret);


--
-- Name: oauth_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE oauth_users
    ADD CONSTRAINT oauth_users_pkey PRIMARY KEY (id);


--
-- Name: users_username_password; Type: INDEX; Schema: public; Owner: -; Tablespace:
--

CREATE INDEX oauth_users_username_password ON oauth_users USING btree (username, password);
